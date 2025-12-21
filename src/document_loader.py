"""
문서 로딩 및 텍스트 청킹 모듈
호스피스/연명의료 관련 문서를 로드하고 RAG에 적합한 크기로 분할합니다.
"""

import os
import re
from pathlib import Path
from typing import List, Optional
from langchain.text_splitter import RecursiveCharacterTextSplitter, MarkdownHeaderTextSplitter
from langchain.schema import Document

from constants import DEFAULT_UNKNOWN, DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP


class DocumentLoader:
    """문서 로더 클래스"""

    def __init__(self, data_dir: str = "data", chunk_size: int = DEFAULT_CHUNK_SIZE, chunk_overlap: int = DEFAULT_CHUNK_OVERLAP):
        """
        Args:
            data_dir: 문서가 저장된 디렉토리 경로
            chunk_size: 청크 크기
            chunk_overlap: 청크 간 중복 크기
        """
        self.data_dir = Path(data_dir)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # 마크다운 헤더 기반 분할기
        self.header_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=[
                ("#", "h1"),
                ("##", "h2"),
                ("###", "h3"),
            ]
        )

        # 문자 기반 분할기 (긴 섹션 추가 분할용)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ".", "。", " ", ""]
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

    def _extract_title(self, content: str, filename: str) -> str:
        """마크다운 첫 번째 헤더에서 제목을 추출합니다."""
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if title_match:
            return title_match.group(1).strip()
        return filename

    def _extract_category(self, filename: str) -> str:
        """파일명에서 카테고리를 추출합니다."""
        # 예: "hospice_1_1.md" -> "hospice"
        parts = filename.split("_")
        if parts:
            return parts[0]
        return DEFAULT_UNKNOWN

    def _extract_section(self, filename: str) -> str:
        """파일명에서 섹션 번호를 추출합니다."""
        # 예: "hospice_1_1.md" -> "1.1"
        parts = filename.split("_")
        if len(parts) > 1:
            section_parts = [p for p in parts[1:] if p.replace(".", "").isdigit()]
            return ".".join(section_parts) if section_parts else ""
        return ""

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

            filename = file_path.stem  # 확장자 제외한 파일명

            # 강화된 메타데이터 추가
            metadata = {
                "source": str(file_path.name),
                "file_type": file_path.suffix,
                "category": self._extract_category(filename),
                "section": self._extract_section(filename),
                "title": self._extract_title(content, filename),
                "char_count": len(content),
            }

            # 단일 Document 객체 생성
            doc = Document(page_content=content, metadata=metadata)
            return [doc]

        except Exception as e:
            print(f"파일 로드 중 오류 발생 ({file_path}): {e}")
            return []

    def _create_chunk(self, content: str, base_metadata: dict,
                       extra_metadata: dict, chunk_index: int) -> Document:
        """
        청크 문서를 생성합니다.

        Args:
            content: 청크 내용
            base_metadata: 기본 메타데이터
            extra_metadata: 추가 메타데이터 (헤더 정보 등)
            chunk_index: 청크 인덱스

        Returns:
            Document 객체
        """
        chunk_metadata = {
            **base_metadata,
            **extra_metadata,
            "chunk_index": chunk_index,
            "chunk_char_count": len(content),
        }
        return Document(page_content=content, metadata=chunk_metadata)

    def _split_text_to_chunks(self, text: str, base_metadata: dict,
                              extra_metadata: dict, start_index: int) -> tuple:
        """
        텍스트를 청크로 분할하고 Document 리스트를 반환합니다.

        Args:
            text: 분할할 텍스트
            base_metadata: 기본 메타데이터
            extra_metadata: 추가 메타데이터
            start_index: 시작 청크 인덱스

        Returns:
            (Document 리스트, 다음 청크 인덱스) 튜플
        """
        chunks = []
        sub_texts = self.text_splitter.split_text(text)
        for sub in sub_texts:
            chunks.append(self._create_chunk(sub, base_metadata, extra_metadata, start_index))
            start_index += 1
        return chunks, start_index

    def split_documents(self, documents: List[Document]) -> List[Document]:
        """
        문서를 시맨틱 단위로 분할합니다.
        마크다운 파일은 헤더 기반 분할을 사용하고, 텍스트 파일은 문자 기반 분할을 사용합니다.

        Args:
            documents: Document 객체 리스트

        Returns:
            분할된 Document 객체 리스트
        """
        all_chunks = []
        chunk_index = 0

        for doc in documents:
            file_type = doc.metadata.get("file_type", "")
            base_metadata = doc.metadata.copy()

            if file_type == ".md":
                # 마크다운 파일: 헤더 기반 시맨틱 분할
                try:
                    header_splits = self.header_splitter.split_text(doc.page_content)

                    for split in header_splits:
                        content = split.page_content
                        header_metadata = split.metadata

                        # 긴 섹션은 추가 분할
                        if len(content) > self.chunk_size * 1.5:
                            chunks, chunk_index = self._split_text_to_chunks(
                                content, base_metadata, header_metadata, chunk_index
                            )
                            all_chunks.extend(chunks)
                        else:
                            all_chunks.append(self._create_chunk(
                                content, base_metadata, header_metadata, chunk_index
                            ))
                            chunk_index += 1

                except Exception as e:
                    # 헤더 분할 실패 시 일반 분할 사용
                    print(f"헤더 분할 실패, 일반 분할 사용: {e}")
                    chunks, chunk_index = self._split_text_to_chunks(
                        doc.page_content, base_metadata, {}, chunk_index
                    )
                    all_chunks.extend(chunks)
            else:
                # 텍스트 파일: 일반 문자 기반 분할
                chunks, chunk_index = self._split_text_to_chunks(
                    doc.page_content, base_metadata, {}, chunk_index
                )
                all_chunks.extend(chunks)

        print(f"문서를 {len(all_chunks)}개의 청크로 분할했습니다.")
        print(f"  - 마크다운 헤더 기반 시맨틱 분할 적용")
        return all_chunks


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
