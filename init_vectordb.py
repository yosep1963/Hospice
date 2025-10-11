"""
벡터 데이터베이스 초기화 스크립트
"""

import sys
import os

# src 디렉토리를 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from document_loader import DocumentLoader
from embeddings import EmbeddingManager

def main():
    print("\n" + "="*60)
    print("벡터 데이터베이스 초기화 시작")
    print("="*60 + "\n")

    # 1. 문서 로드
    print("1단계: 문서 로딩...")
    loader = DocumentLoader(data_dir="data")
    documents = loader.load_documents()

    # 2. 문서 분할
    print("\n2단계: 문서 청킹...")
    split_docs = loader.split_documents(documents)

    # 3. 임베딩 및 벡터 스토어 생성
    print("\n3단계: 벡터 데이터베이스 생성 (시간이 걸릴 수 있습니다)...")
    embedding_manager = EmbeddingManager(persist_directory="vector_db")
    vectorstore = embedding_manager.create_vectorstore(split_docs)

    # 4. 테스트 검색
    print("\n4단계: 테스트 검색...")
    test_query = "연명의료란 무엇인가요?"
    print(f"\n테스트 질문: '{test_query}'")

    results = embedding_manager.similarity_search_with_score(test_query, k=2)

    for i, (doc, score) in enumerate(results, 1):
        print(f"\n[검색 결과 {i}] (유사도: {score:.4f})")
        print(f"출처: {doc.metadata['source']}")
        print(f"내용: {doc.page_content[:200]}...")

    print("\n" + "="*60)
    print("벡터 데이터베이스 초기화 완료!")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
