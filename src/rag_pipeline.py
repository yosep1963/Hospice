"""
RAG 파이프라인 모듈
검색된 문서를 기반으로 LLM이 답변을 생성하도록 관리합니다.
"""

import hashlib
from typing import List, Dict, Tuple, Optional, Generator
from collections import OrderedDict
from langchain.schema import Document
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from constants import (
    DEFAULT_UNKNOWN, DEFAULT_CACHE_SIZE,
    SOURCES_HEADER, SOURCES_SEPARATOR
)


class RAGPipeline:
    """RAG 파이프라인 클래스"""

    def __init__(self, vectorstore, config=None, model_name: str = "qwen2.5:14b"):
        """
        Args:
            vectorstore: Chroma 벡터 스토어
            config: AppConfig 객체 (설정 파일에서 로드)
            model_name: Ollama 모델 이름 (config가 없을 때 사용)
        """
        self.vectorstore = vectorstore
        self.config = config

        # 설정에서 값 가져오기 (config 우선, 없으면 기본값)
        if config:
            self.model_name = config.llm.model_name
            self.temperature = config.llm.temperature
            self.base_url = config.llm.base_url
            self.top_k = config.rag.top_k
            self.cache_enabled = config.performance.enable_cache
            self.search_type = getattr(config.rag, 'search_type', 'similarity')
            self.mmr_lambda = getattr(config.rag, 'mmr_lambda', 0.5)
        else:
            self.model_name = model_name
            self.temperature = 0.3
            self.base_url = "http://localhost:11434"
            self.top_k = 3
            self.cache_enabled = True
            self.search_type = 'similarity'
            self.mmr_lambda = 0.5

        # 캐시 초기화
        self._cache: OrderedDict = OrderedDict()
        self._max_cache_size = DEFAULT_CACHE_SIZE

        # Ollama LLM 초기화
        print(f"Ollama 모델 '{self.model_name}' 초기화 중...")
        print(f"  - Temperature: {self.temperature}")
        print(f"  - Top-K 검색: {self.top_k}")
        print(f"  - 캐시: {'활성화' if self.cache_enabled else '비활성화'}")

        self.llm = Ollama(
            model=self.model_name,
            base_url=self.base_url,
            temperature=self.temperature,
            num_ctx=4096,
        )
        print("LLM 초기화 완료!")

        # 프롬프트 템플릿 설정
        self.prompt_template = self._create_prompt_template()

    def _create_prompt_template(self) -> PromptTemplate:
        """
        RAG용 프롬프트 템플릿을 생성합니다.

        Returns:
            PromptTemplate 객체
        """
        template = """당신은 호스피스 및 연명의료결정제도 전문 상담 챗봇입니다.

**중요한 규칙:**
1. 반드시 제공된 문서(Context)의 내용만을 기반으로 답변하세요.
2. 문서에 없는 내용은 절대 추측하거나 생성하지 마세요.
3. 문서에서 답을 찾을 수 없다면 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 답변하세요.
4. 답변은 정확하고 명확하게 작성하세요.
5. 가능한 경우, 관련 법령이나 절차를 함께 안내하세요.

**Context (참고 문서):**
{context}

**질문:**
{question}

**답변:**"""

        return PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )

    def _get_cache_key(self, question: str) -> str:
        """질문에 대한 캐시 키를 생성합니다."""
        return hashlib.md5(question.strip().lower().encode()).hexdigest()

    def _get_retriever(self):
        """검색 유형에 따른 retriever를 반환합니다."""
        if self.search_type == "mmr":
            return self.vectorstore.as_retriever(
                search_type="mmr",
                search_kwargs={
                    "k": self.top_k,
                    "lambda_mult": self.mmr_lambda
                }
            )
        return self.vectorstore.as_retriever(
            search_kwargs={"k": self.top_k}
        )

    def _enhance_question_with_history(self, question: str, history: Optional[List[Tuple[str, str]]] = None) -> str:
        """대화 히스토리를 활용하여 질문을 확장합니다."""
        if history and len(history) > 0:
            recent_questions = [q for q, a in history[-2:]]
            return " ".join(recent_questions) + " " + question
        return question

    def _format_context(self, documents: List[Document]) -> str:
        """검색된 문서들을 컨텍스트 문자열로 변환합니다."""
        return "\n\n".join([doc.page_content for doc in documents])

    def _format_sources(self, documents: List[Document]) -> str:
        """문서 출처를 포맷팅된 문자열로 반환합니다."""
        sources = set([doc.metadata.get("source", DEFAULT_UNKNOWN) for doc in documents])
        return SOURCES_HEADER + SOURCES_SEPARATOR.join(sources)

    def create_qa_chain(self):
        """
        질의응답 체인을 생성합니다.

        Returns:
            RetrievalQA 체인
        """
        retriever = self._get_retriever()

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": self.prompt_template}
        )

        return qa_chain

    def _retrieve_documents(self, question: str) -> List[Document]:
        """문서를 검색합니다. MMR 또는 similarity 검색 사용."""
        if self.search_type == "mmr":
            return self.vectorstore.max_marginal_relevance_search(
                question, k=self.top_k, lambda_mult=self.mmr_lambda
            )
        return self.vectorstore.similarity_search(question, k=self.top_k)

    def query(self, question: str, history: Optional[List[Tuple[str, str]]] = None) -> Dict:
        """
        질문에 대한 답변을 생성합니다.

        Args:
            question: 사용자 질문
            history: 대화 히스토리 (선택사항)

        Returns:
            답변 및 출처 정보를 포함한 딕셔너리
        """
        # 캐시 확인
        if self.cache_enabled:
            cache_key = self._get_cache_key(question)
            if cache_key in self._cache:
                print("[캐시] 캐시된 응답 사용")
                return self._cache[cache_key]

        # 대화 컨텍스트를 활용한 쿼리 확장
        enhanced_question = self._enhance_question_with_history(question, history)

        # 검색된 문서 가져오기
        retrieved_docs = self._retrieve_documents(enhanced_question)

        # 컨텍스트 구성 및 프롬프트 생성
        context = self._format_context(retrieved_docs)
        prompt = self.prompt_template.format(context=context, question=question)

        # LLM으로 답변 생성
        response = self.llm.invoke(prompt)

        # 결과 구성
        result = {
            "question": question,
            "answer": response,
            "source_documents": retrieved_docs
        }

        # 캐시에 저장
        if self.cache_enabled:
            if len(self._cache) >= self._max_cache_size:
                self._cache.popitem(last=False)
            self._cache[cache_key] = result

        return result

    def query_stream(self, question: str, history: Optional[List[Tuple[str, str]]] = None) -> Generator[str, None, None]:
        """
        스트리밍 방식으로 질문에 대한 답변을 생성합니다.

        Args:
            question: 사용자 질문
            history: 대화 히스토리 (선택사항)

        Yields:
            응답 텍스트 청크
        """
        # 대화 컨텍스트를 활용한 쿼리 확장
        enhanced_question = self._enhance_question_with_history(question, history)

        # 검색된 문서 가져오기
        retrieved_docs = self._retrieve_documents(enhanced_question)

        # 컨텍스트 구성 및 프롬프트 생성
        context = self._format_context(retrieved_docs)
        prompt = self.prompt_template.format(context=context, question=question)

        # 스트리밍으로 LLM 응답 생성
        full_response = ""
        for chunk in self.llm.stream(prompt):
            full_response += chunk
            yield full_response

        # 출처 정보 추가
        yield full_response + self._format_sources(retrieved_docs)

    def query_with_sources(self, question: str, history: Optional[List[Tuple[str, str]]] = None) -> str:
        """
        질문에 대한 답변과 출처를 함께 반환합니다.

        Args:
            question: 사용자 질문
            history: 대화 히스토리 (선택사항)

        Returns:
            답변 및 출처가 포함된 문자열
        """
        result = self.query(question, history=history)
        return result["answer"] + self._format_sources(result["source_documents"])

    def clear_cache(self):
        """캐시를 초기화합니다."""
        self._cache.clear()
        print("[캐시] 캐시가 초기화되었습니다.")


def main():
    """테스트용 메인 함수"""
    from document_loader import DocumentLoader
    from embeddings import EmbeddingManager
    import os

    # 벡터 스토어가 있는지 확인
    if os.path.exists("vector_db"):
        print("기존 벡터 스토어를 사용합니다.")
        embedding_manager = EmbeddingManager()
        vectorstore = embedding_manager.load_vectorstore()
    else:
        print("새로운 벡터 스토어를 생성합니다.")
        loader = DocumentLoader()
        documents = loader.load_documents()
        split_docs = loader.split_documents(documents)

        embedding_manager = EmbeddingManager()
        vectorstore = embedding_manager.create_vectorstore(split_docs)

    # RAG 파이프라인 생성
    rag = RAGPipeline(vectorstore)

    # 테스트 질문
    test_questions = [
        "연명의료란 무엇인가요?",
        "임종과정에 있는 환자의 정의는?",
        "사전연명의료의향서는 어떻게 작성하나요?"
    ]

    for q in test_questions:
        print(f"\n{'='*60}")
        print(f"질문: {q}")
        print(f"{'='*60}")
        answer = rag.query_with_sources(q)
        print(answer)


if __name__ == "__main__":
    main()
