"""
RAG 파이프라인 모듈
검색된 문서를 기반으로 LLM이 답변을 생성하도록 관리합니다.
"""

from typing import List, Dict
from langchain.schema import Document
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser


class RAGPipeline:
    """RAG 파이프라인 클래스"""

    def __init__(self, vectorstore, model_name: str = "qwen2.5:14b"):
        """
        Args:
            vectorstore: Chroma 벡터 스토어
            model_name: Ollama 모델 이름
        """
        self.vectorstore = vectorstore
        self.model_name = model_name

        # Ollama LLM 초기화
        print(f"Ollama 모델 '{model_name}' 초기화 중...")
        self.llm = Ollama(
            model=model_name,
            temperature=0.1,  # 낮은 온도로 일관된 답변 생성
            num_ctx=4096,  # 컨텍스트 윈도우 크기
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

    def create_qa_chain(self):
        """
        질의응답 체인을 생성합니다.

        Returns:
            RetrievalQA 체인
        """
        retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": 4}  # 상위 4개 문서 검색
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True,
            chain_type_kwargs={"prompt": self.prompt_template}
        )

        return qa_chain

    def query(self, question: str) -> Dict:
        """
        질문에 대한 답변을 생성합니다.

        Args:
            question: 사용자 질문

        Returns:
            답변 및 출처 정보를 포함한 딕셔너리
        """
        # 검색된 문서 가져오기
        retrieved_docs = self.vectorstore.similarity_search(question, k=4)

        # 컨텍스트 구성
        context = "\n\n".join([doc.page_content for doc in retrieved_docs])

        # 프롬프트 생성
        prompt = self.prompt_template.format(
            context=context,
            question=question
        )

        # LLM으로 답변 생성
        response = self.llm.invoke(prompt)

        # 결과 반환
        return {
            "question": question,
            "answer": response,
            "source_documents": retrieved_docs
        }

    def query_with_sources(self, question: str) -> str:
        """
        질문에 대한 답변과 출처를 함께 반환합니다.

        Args:
            question: 사용자 질문

        Returns:
            답변 및 출처가 포함된 문자열
        """
        result = self.query(question)

        # 답변 구성
        answer = result["answer"]

        # 출처 정보 추가
        sources = set([doc.metadata["source"] for doc in result["source_documents"]])
        sources_text = "\n\n📚 **참고 문서:**\n- " + "\n- ".join(sources)

        return answer + sources_text


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
