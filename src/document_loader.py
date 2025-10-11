"""
문서 로딩 및 텍스트 청킹 모듈
호스피스/연명의료 관련 문서를 로드하고 RAG에 적합한 크기로 분할합니다.
"""

import os
from pathlib import Path
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document


class DocumentLoader:
    """문서 로더 클래스"""

    def __init__(self, data_dir: str = "data"):
        """
        Args:
            data_dir: 문서가 저장된 디렉토리 경로
        """
        self.data_dir = Path(data_dir)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ".", " ", ""]
        )

    def load_documents(self) -> List[Document]:
        """
        data 디렉토리의 모든 .md와 .txt 파일을 로드합니다.

        Returns:
            Document 객체 리스트
        """
        documents = []

        if not self.data_dir.exists():
            raise FileNotFoundError(f"디렉토리를 찾을 수 없습니다: {self.data_dir}")

        # .md와 .txt 파일 로드
        for file_path in self.data_dir.glob("*.md"):
            documents.extend(self._load_file(file_path))

        for file_path in self.data_dir.glob("*.txt"):
            documents.extend(self._load_file(file_path))

        print(f"총 {len(documents)}개의 문서를 로드했습니다.")
        return documents

    def _load_file(self, file_path: Path) -> List[Document]:
        """
        개별 파일을 로드하고 Document 객체로 변환합니다.

        Args:
            file_path: 파일 경로

        Returns:
            Document 객체 리스트
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # 메타데이터 추가
            metadata = {
                "source": str(file_path.name),
                "file_type": file_path.suffix
            }

            # 단일 Document 객체 생성
            doc = Document(page_content=content, metadata=metadata)
            return [doc]

        except Exception as e:
            print(f"파일 로드 중 오류 발생 ({file_path}): {e}")
            return []

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """
        문서를 작은 청크로 분할합니다.

        Args:
            documents: Document 객체 리스트

        Returns:
            분할된 Document 객체 리스트
        """
        split_docs = self.text_splitter.split_documents(documents)
        print(f"문서를 {len(split_docs)}개의 청크로 분할했습니다.")
        return split_docs


def main():
    """테스트용 메인 함수"""
    loader = DocumentLoader()

    # 문서 로드
    documents = loader.load_documents()

    # 문서 분할
    split_docs = loader.split_documents(documents)

    # 샘플 출력
    if split_docs:
        print("\n=== 첫 번째 청크 샘플 ===")
        print(f"출처: {split_docs[0].metadata['source']}")
        print(f"내용: {split_docs[0].page_content[:200]}...")


if __name__ == "__main__":
    main()
