"""
애플리케이션 전역 상수 모듈
중복된 하드코딩된 값들을 중앙 집중화합니다.
"""

# 벡터 데이터베이스 설정
COLLECTION_NAME = "hospice_docs"

# 기본값
DEFAULT_UNKNOWN = "unknown"
DEFAULT_CHUNK_SIZE = 1000
DEFAULT_CHUNK_OVERLAP = 200
DEFAULT_TOP_K = 3
DEFAULT_TEMPERATURE = 0.3
DEFAULT_CACHE_SIZE = 100

# 출력 포맷
SOURCES_HEADER = "\n\n**[참고 문서]**\n- "
SOURCES_SEPARATOR = "\n- "

# 검색 유형
SEARCH_TYPE_SIMILARITY = "similarity"
SEARCH_TYPE_MMR = "mmr"
