"""
챗봇 메인 클래스
전체 RAG 챗봇 시스템을 관리합니다.
"""

import os
from typing import List, Tuple, Optional, Generator
from document_loader import DocumentLoader
from embeddings import EmbeddingManager
from rag_pipeline import RAGPipeline
from logger import setup_logger, get_logger


class HospiceChatbot:
    """호스피스 챗봇 클래스"""

    def __init__(
        self,
        data_dir: str = "data",
        vector_db_dir: str = "vector_db",
        model_name: str = "qwen2.5:14b",
        log_level: str = "INFO",
        config=None
    ):
        """
        Args:
            data_dir: 문서 디렉토리
            vector_db_dir: 벡터 DB 디렉토리
            model_name: Ollama 모델 이름
            log_level: 로깅 레벨 (DEBUG, INFO, WARNING, ERROR)
            config: AppConfig 객체 (설정 파일에서 로드)
        """
        self.data_dir = data_dir
        self.vector_db_dir = vector_db_dir
        self.model_name = model_name
        self.config = config

        self.vectorstore = None
        self.rag_pipeline = None
        self.chat_history: List[Tuple[str, str]] = []

        # 로거 설정
        self.logger = setup_logger(log_level=log_level)

    def initialize(self) -> bool:
        """
        챗봇을 초기화합니다.

        Returns:
            초기화 성공 여부
        """
        try:
            self.logger.info("챗봇 초기화 시작")
            print("\n" + "="*60)
            print("호스피스 챗봇 초기화 중...")
            print("="*60 + "\n")

            # 1. 데이터 디렉토리 확인
            if not os.path.exists(self.data_dir):
                error_msg = f"데이터 디렉토리를 찾을 수 없습니다: {self.data_dir}"
                self.logger.error(error_msg)
                raise FileNotFoundError(error_msg)

            # 2. 벡터 스토어 로드 또는 생성
            self.logger.info("벡터 스토어 초기화 중...")
            embedding_manager = EmbeddingManager(self.vector_db_dir)

            if os.path.exists(self.vector_db_dir) and os.listdir(self.vector_db_dir):
                print("[OK] 기존 벡터 스토어를 로드합니다.")
                self.logger.info("기존 벡터 스토어 로드")
                self.vectorstore = embedding_manager.load_vectorstore()
            else:
                print("[OK] 새로운 벡터 스토어를 생성합니다.")
                self.logger.info("새로운 벡터 스토어 생성")
                loader = DocumentLoader(self.data_dir)
                documents = loader.load_documents()

                if not documents:
                    error_msg = f"문서를 찾을 수 없습니다: {self.data_dir}"
                    self.logger.error(error_msg)
                    raise ValueError(error_msg)

                split_docs = loader.split_documents(documents)
                self.logger.info(f"{len(split_docs)}개의 문서 청크 생성")
                self.vectorstore = embedding_manager.create_vectorstore(split_docs)

            # 3. RAG 파이프라인 초기화
            self.logger.info(f"RAG 파이프라인 초기화 (모델: {self.model_name})")
            self.rag_pipeline = RAGPipeline(
                self.vectorstore,
                config=self.config,
                model_name=self.model_name
            )

            print("\n" + "="*60)
            print("[OK] 챗봇 초기화 완료!")
            print("="*60 + "\n")
            self.logger.info("챗봇 초기화 완료")
            return True

        except FileNotFoundError as e:
            self.logger.error(f"파일/디렉토리 오류: {e}")
            print(f"\n[오류] {e}")
            return False
        except ValueError as e:
            self.logger.error(f"값 오류: {e}")
            print(f"\n[오류] {e}")
            return False
        except Exception as e:
            self.logger.error(f"예기치 않은 오류: {e}", exc_info=True)
            print(f"\n[오류] 초기화 중 예기치 않은 오류가 발생했습니다: {e}")
            return False

    def chat(self, message: str) -> str:
        """
        사용자 메시지에 대한 응답을 생성합니다.

        Args:
            message: 사용자 메시지

        Returns:
            챗봇 응답
        """
        try:
            if self.rag_pipeline is None:
                error_msg = "챗봇이 초기화되지 않았습니다. initialize()를 먼저 호출하세요."
                self.logger.error(error_msg)
                raise ValueError(error_msg)

            if not message or not message.strip():
                self.logger.warning("빈 메시지 수신")
                return "질문을 입력해주세요."

            self.logger.info(f"질문 수신: {message[:50]}...")

            # RAG 파이프라인으로 응답 생성 (대화 히스토리 전달)
            response = self.rag_pipeline.query_with_sources(
                message,
                history=self.chat_history[-3:] if self.chat_history else None
            )

            # 채팅 히스토리에 추가
            self.chat_history.append((message, response))
            self.logger.info(f"응답 생성 완료 ({len(response)}자)")

            return response

        except ValueError as e:
            self.logger.error(f"값 오류: {e}")
            return f"오류: {str(e)}"
        except Exception as e:
            self.logger.error(f"응답 생성 중 오류: {e}", exc_info=True)
            return f"죄송합니다. 응답 생성 중 오류가 발생했습니다: {str(e)}"

    def chat_stream(self, message: str) -> Generator[str, None, None]:
        """
        스트리밍 방식으로 사용자 메시지에 대한 응답을 생성합니다.

        Args:
            message: 사용자 메시지

        Yields:
            응답 텍스트 청크
        """
        try:
            if self.rag_pipeline is None:
                error_msg = "챗봇이 초기화되지 않았습니다. initialize()를 먼저 호출하세요."
                self.logger.error(error_msg)
                yield f"오류: {error_msg}"
                return

            if not message or not message.strip():
                self.logger.warning("빈 메시지 수신")
                yield "질문을 입력해주세요."
                return

            self.logger.info(f"스트리밍 질문 수신: {message[:50]}...")

            # RAG 파이프라인으로 스트리밍 응답 생성
            final_response = ""
            for partial_response in self.rag_pipeline.query_stream(
                message,
                history=self.chat_history[-3:] if self.chat_history else None
            ):
                final_response = partial_response
                yield partial_response

            # 채팅 히스토리에 추가
            self.chat_history.append((message, final_response))
            self.logger.info(f"스트리밍 응답 완료 ({len(final_response)}자)")

        except Exception as e:
            self.logger.error(f"스트리밍 응답 생성 중 오류: {e}", exc_info=True)
            yield f"죄송합니다. 응답 생성 중 오류가 발생했습니다: {str(e)}"

    def get_chat_history(self) -> List[Tuple[str, str]]:
        """
        채팅 히스토리를 반환합니다.

        Returns:
            (질문, 답변) 튜플 리스트
        """
        return self.chat_history

    def clear_history(self):
        """채팅 히스토리를 초기화합니다."""
        self.chat_history = []

    def rebuild_vectorstore(self):
        """벡터 스토어를 재구성합니다."""
        print("벡터 스토어를 재구성합니다...")

        loader = DocumentLoader(self.data_dir)
        documents = loader.load_documents()
        split_docs = loader.split_documents(documents)

        embedding_manager = EmbeddingManager(self.vector_db_dir)
        self.vectorstore = embedding_manager.create_vectorstore(split_docs)

        # RAG 파이프라인 재초기화
        self.rag_pipeline = RAGPipeline(
            self.vectorstore,
            config=self.config,
            model_name=self.model_name
        )

        print("벡터 스토어 재구성 완료!")

    def clear_cache(self):
        """RAG 파이프라인 캐시를 초기화합니다."""
        if self.rag_pipeline:
            self.rag_pipeline.clear_cache()


def main():
    """테스트용 메인 함수"""
    # 챗봇 초기화
    chatbot = HospiceChatbot()
    chatbot.initialize()

    # 대화형 인터페이스
    print("\n호스피스 챗봇에 오신 것을 환영합니다!")
    print("종료하려면 'quit' 또는 'exit'를 입력하세요.\n")

    while True:
        user_input = input("질문: ").strip()

        if user_input.lower() in ['quit', 'exit', '종료']:
            print("챗봇을 종료합니다.")
            break

        if not user_input:
            continue

        print("\n답변 생성 중...\n")
        response = chatbot.chat(user_input)
        print(f"답변: {response}\n")
        print("-" * 60 + "\n")


if __name__ == "__main__":
    main()
