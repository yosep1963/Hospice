"""
로깅 설정 모듈
애플리케이션 전체의 로깅을 통합 관리합니다.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime


def setup_logger(
    name: str = "hospice_chatbot",
    log_level: str = "INFO",
    log_dir: str = "logs"
) -> logging.Logger:
    """
    로거를 설정합니다.

    Args:
        name: 로거 이름
        log_level: 로깅 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_dir: 로그 파일 저장 디렉토리

    Returns:
        설정된 Logger 객체
    """
    # 로그 디렉토리 생성
    log_path = Path(log_dir)
    log_path.mkdir(exist_ok=True)

    # 로거 생성
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, log_level.upper()))

    # 기존 핸들러 제거 (중복 방지)
    if logger.handlers:
        logger.handlers.clear()

    # 포맷터 설정
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # 콘솔 핸들러
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # 파일 핸들러 (전체 로그)
    today = datetime.now().strftime('%Y%m%d')
    file_handler = logging.FileHandler(
        log_path / f"chatbot_{today}.log",
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    # 에러 전용 핸들러
    error_handler = logging.FileHandler(
        log_path / f"errors_{today}.log",
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)

    return logger


def get_logger(name: str = "hospice_chatbot") -> logging.Logger:
    """
    기존 로거를 가져옵니다.

    Args:
        name: 로거 이름

    Returns:
        Logger 객체
    """
    logger = logging.getLogger(name)

    # 로거가 아직 설정되지 않았다면 기본 설정 적용
    if not logger.handlers:
        return setup_logger(name)

    return logger
