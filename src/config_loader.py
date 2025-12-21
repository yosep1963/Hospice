"""
설정 파일 로더
YAML 설정 파일을 읽어 애플리케이션 설정을 관리합니다.
"""

import yaml
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class DataConfig:
    """데이터 설정"""
    data_dir: str = "data"
    vector_db_dir: str = "vector_db"


@dataclass
class LLMConfig:
    """LLM 설정"""
    model_name: str = "qwen2.5:14b"
    base_url: str = "http://localhost:11434"
    temperature: float = 0.3
    top_p: float = 0.9
    top_k: int = 40


@dataclass
class RAGConfig:
    """RAG 설정"""
    top_k: int = 3
    chunk_size: int = 1000
    chunk_overlap: int = 200
    search_type: str = "similarity"  # "similarity" 또는 "mmr"
    mmr_lambda: float = 0.5  # MMR 다양성 파라미터 (0.0-1.0)


@dataclass
class EmbeddingsConfig:
    """임베딩 설정"""
    model_name: str = "BAAI/bge-m3"
    device: str = "auto"
    normalize: bool = True


@dataclass
class WebConfig:
    """웹 UI 설정"""
    server_name: str = "0.0.0.0"
    server_port: int = 7860
    share: bool = False
    chatbot_height: int = 500


@dataclass
class LoggingConfig:
    """로깅 설정"""
    level: str = "INFO"
    log_dir: str = "logs"
    console_output: bool = True


@dataclass
class PerformanceConfig:
    """성능 설정"""
    optimize_gpu_memory: bool = False
    batch_size: int = 32
    enable_cache: bool = True


@dataclass
class AppConfig:
    """애플리케이션 전체 설정"""
    data: DataConfig
    llm: LLMConfig
    rag: RAGConfig
    embeddings: EmbeddingsConfig
    web: WebConfig
    logging: LoggingConfig
    performance: PerformanceConfig


class ConfigLoader:
    """설정 파일 로더 클래스"""

    def __init__(self, config_path: str = "config.yaml"):
        """
        Args:
            config_path: 설정 파일 경로
        """
        self.config_path = Path(config_path)

    def load(self) -> AppConfig:
        """
        설정 파일을 로드합니다.

        Returns:
            AppConfig 객체
        """
        if not self.config_path.exists():
            print(f"[경고] 설정 파일을 찾을 수 없습니다: {self.config_path}")
            print("[안내] 기본 설정을 사용합니다.")
            return self._get_default_config()

        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config_dict = yaml.safe_load(f)

            return self._dict_to_config(config_dict)

        except yaml.YAMLError as e:
            print(f"[오류] 설정 파일 파싱 실패: {e}")
            print("[안내] 기본 설정을 사용합니다.")
            return self._get_default_config()
        except Exception as e:
            print(f"[오류] 설정 파일 로드 실패: {e}")
            print("[안내] 기본 설정을 사용합니다.")
            return self._get_default_config()

    def _dict_to_config(self, config_dict: Dict[str, Any]) -> AppConfig:
        """
        딕셔너리를 AppConfig 객체로 변환합니다.

        Args:
            config_dict: 설정 딕셔너리

        Returns:
            AppConfig 객체
        """
        return AppConfig(
            data=DataConfig(**config_dict.get('data', {})),
            llm=LLMConfig(**config_dict.get('llm', {})),
            rag=RAGConfig(**config_dict.get('rag', {})),
            embeddings=EmbeddingsConfig(**config_dict.get('embeddings', {})),
            web=WebConfig(**config_dict.get('web', {})),
            logging=LoggingConfig(**config_dict.get('logging', {})),
            performance=PerformanceConfig(**config_dict.get('performance', {}))
        )

    def _get_default_config(self) -> AppConfig:
        """
        기본 설정을 반환합니다.

        Returns:
            기본 AppConfig 객체
        """
        return AppConfig(
            data=DataConfig(),
            llm=LLMConfig(),
            rag=RAGConfig(),
            embeddings=EmbeddingsConfig(),
            web=WebConfig(),
            logging=LoggingConfig(),
            performance=PerformanceConfig()
        )

    def save_default(self, output_path: Optional[str] = None):
        """
        기본 설정을 파일로 저장합니다.

        Args:
            output_path: 출력 파일 경로 (None이면 config_path 사용)
        """
        if output_path is None:
            output_path = self.config_path

        default_config = self._get_default_config()
        config_dict = self._config_to_dict(default_config)

        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(config_dict, f, allow_unicode=True, default_flow_style=False, sort_keys=False)

        print(f"[OK] 기본 설정 파일 생성: {output_path}")

    def _config_to_dict(self, config: AppConfig) -> Dict[str, Any]:
        """
        AppConfig 객체를 딕셔너리로 변환합니다.

        Args:
            config: AppConfig 객체

        Returns:
            설정 딕셔너리
        """
        return {
            'data': vars(config.data),
            'llm': vars(config.llm),
            'rag': vars(config.rag),
            'embeddings': vars(config.embeddings),
            'web': vars(config.web),
            'logging': vars(config.logging),
            'performance': vars(config.performance)
        }


def load_config(config_path: str = "config.yaml") -> AppConfig:
    """
    설정 파일을 로드합니다. (편의 함수)

    Args:
        config_path: 설정 파일 경로

    Returns:
        AppConfig 객체
    """
    loader = ConfigLoader(config_path)
    return loader.load()
