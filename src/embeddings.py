"""
임베딩 및 벡터 데이터베이스 모듈
문서를 벡터로 변환하고 ChromaDB에 저장 및 검색합니다.
"""

from typing import List
from langchain.schema import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import chromadb


class EmbeddingManager:
    """임베딩 및 벡터 DB 관리 클래스"""

    def __init__(self, persist_directory: str = "vector_db"):
        """
        Args:
            persist_directory: 벡터 DB 저장 디렉토리
        """
        self.persist_directory = persist_directory

        # BGE-M3 임베딩 모델 초기화 (한국어 지원 우수)
        print("임베딩 모델을 로드하는 중...")

        # GPU 사용 가능 여부 확인
        import torch
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"사용 장치: {device}")

        self.embeddings = HuggingFaceEmbeddings(
            model_name="BAAI/bge-m3",
            model_kwargs={'device': device},
            encode_kwargs={'normalize_embeddings': True}
        )
        print("임베딩 모델 로드 완료!")

        self.vectorstore = None

    def create_vectorstore(self, documents: List[Document]) -> Chroma:
        """
        문서로부터 벡터 스토어를 생성합니다.

        Args:
            documents: Document 객체 리스트

        Returns:
            Chroma 벡터 스토어
        """
        print(f"{len(documents)}개의 문서를 벡터화하는 중...")

        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name="hospice_docs"
        )

        print("벡터 스토어 생성 완료!")
        return self.vectorstore

    def load_vectorstore(self) -> Chroma:
        """
        기존 벡터 스토어를 로드합니다.

        Returns:
            Chroma 벡터 스토어
        """
        print("기존 벡터 스토어를 로드하는 중...")

        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name="hospice_docs"
        )

        print("벡터 스토어 로드 완료!")
        return self.vectorstore

    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        """
        쿼리와 유사한 문서를 검색합니다.

        Args:
            query: 검색 쿼리
            k: 반환할 문서 개수

        Returns:
            유사한 Document 객체 리스트
        """
        if self.vectorstore is None:
            raise ValueError("벡터 스토어가 초기화되지 않았습니다.")

        results = self.vectorstore.similarity_search(query, k=k)
        return results

    def similarity_search_with_score(self, query: str, k: int = 3) -> List[tuple]:
        """
        쿼리와 유사한 문서를 점수와 함께 검색합니다.

        Args:
            query: 검색 쿼리
            k: 반환할 문서 개수

        Returns:
            (Document, score) 튜플 리스트
        """
        if self.vectorstore is None:
            raise ValueError("벡터 스토어가 초기화되지 않았습니다.")

        results = self.vectorstore.similarity_search_with_score(query, k=k)
        return results


def main():
    """테스트용 메인 함수"""
    from document_loader import DocumentLoader

    # 문서 로드
    loader = DocumentLoader()
    documents = loader.load_documents()
    split_docs = loader.split_documents(documents)

    # 임베딩 및 벡터 스토어 생성
    embedding_manager = EmbeddingManager()
    vectorstore = embedding_manager.create_vectorstore(split_docs)

    # 테스트 검색
    test_query = "연명의료란 무엇인가요?"
    print(f"\n=== 검색 테스트: '{test_query}' ===")

    results = embedding_manager.similarity_search_with_score(test_query, k=2)

    for i, (doc, score) in enumerate(results, 1):
        print(f"\n[결과 {i}] (유사도: {score:.4f})")
        print(f"출처: {doc.metadata['source']}")
        print(f"내용: {doc.page_content[:150]}...")


if __name__ == "__main__":
    main()
