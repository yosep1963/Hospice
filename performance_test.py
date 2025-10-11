"""
성능 테스트 및 벤치마크 스크립트
"""

import sys
import os
import time
from pathlib import Path

# src 디렉토리를 경로에 추가
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from chatbot import HospiceChatbot
from config_loader import load_config


def test_initialization():
    """초기화 성능 테스트"""
    print("\n" + "="*60)
    print("1. 초기화 성능 테스트")
    print("="*60)

    config = load_config()

    start_time = time.time()
    chatbot = HospiceChatbot(
        data_dir=config.data.data_dir,
        vector_db_dir=config.data.vector_db_dir,
        model_name=config.llm.model_name
    )
    success = chatbot.initialize()
    end_time = time.time()

    if success:
        print(f"\n[OK] 초기화 완료")
        print(f"[성능] 소요 시간: {end_time - start_time:.2f}초")
    else:
        print(f"\n[오류] 초기화 실패")
        return None

    return chatbot


def test_query_performance(chatbot, queries):
    """쿼리 응답 성능 테스트"""
    print("\n" + "="*60)
    print("2. 쿼리 응답 성능 테스트")
    print("="*60)

    total_time = 0
    results = []

    for i, query in enumerate(queries, 1):
        print(f"\n[테스트 {i}/{len(queries)}] {query}")

        start_time = time.time()
        response = chatbot.chat(query)
        end_time = time.time()

        elapsed = end_time - start_time
        total_time += elapsed

        results.append({
            'query': query,
            'response_length': len(response),
            'time': elapsed
        })

        print(f"[성능] 응답 시간: {elapsed:.2f}초")
        print(f"[성능] 응답 길이: {len(response)}자")

    avg_time = total_time / len(queries)
    print(f"\n[요약] 평균 응답 시간: {avg_time:.2f}초")
    print(f"[요약] 총 소요 시간: {total_time:.2f}초")

    return results


def test_gpu_utilization():
    """GPU 사용률 확인"""
    print("\n" + "="*60)
    print("3. GPU 사용률 확인")
    print("="*60)

    try:
        import torch

        if torch.cuda.is_available():
            print(f"[OK] CUDA 사용 가능")
            print(f"[OK] GPU: {torch.cuda.get_device_name(0)}")
            print(f"[OK] CUDA 버전: {torch.version.cuda}")

            # GPU 메모리 정보
            total_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            allocated_memory = torch.cuda.memory_allocated(0) / (1024**3)
            reserved_memory = torch.cuda.memory_reserved(0) / (1024**3)

            print(f"\n[메모리] 전체: {total_memory:.2f} GB")
            print(f"[메모리] 할당됨: {allocated_memory:.2f} GB")
            print(f"[메모리] 예약됨: {reserved_memory:.2f} GB")
            print(f"[메모리] 사용률: {(allocated_memory/total_memory)*100:.1f}%")
        else:
            print("[경고] CUDA를 사용할 수 없습니다. CPU 모드로 실행 중입니다.")

    except ImportError:
        print("[오류] PyTorch를 찾을 수 없습니다.")


def test_vectorstore_performance(chatbot):
    """벡터 스토어 성능 테스트"""
    print("\n" + "="*60)
    print("4. 벡터 스토어 검색 성능")
    print("="*60)

    test_queries = [
        "연명의료",
        "임종과정",
        "사전연명의료의향서"
    ]

    for query in test_queries:
        start_time = time.time()

        # 벡터 검색 수행
        results = chatbot.vectorstore.similarity_search(query, k=3)

        end_time = time.time()

        print(f"\n[쿼리] {query}")
        print(f"[성능] 검색 시간: {(end_time - start_time)*1000:.2f}ms")
        print(f"[결과] {len(results)}개 문서 검색됨")


def main():
    """메인 테스트 실행"""
    print("\n" + "="*70)
    print("  호스피스 챗봇 성능 테스트")
    print("="*70)

    # GPU 확인
    test_gpu_utilization()

    # 초기화 테스트
    chatbot = test_initialization()
    if chatbot is None:
        print("\n[오류] 초기화 실패로 테스트를 중단합니다.")
        return

    # 벡터 스토어 성능 테스트
    test_vectorstore_performance(chatbot)

    # 쿼리 응답 성능 테스트
    test_queries = [
        "연명의료란 무엇인가요?",
        "임종과정에 있는 환자의 정의는?",
        "사전연명의료의향서는 누가 작성할 수 있나요?"
    ]

    results = test_query_performance(chatbot, test_queries)

    # 최종 요약
    print("\n" + "="*70)
    print("  테스트 완료")
    print("="*70)
    print("\n[안내] 성능 테스트가 완료되었습니다.")
    print("[안내] 로그 파일은 'logs/' 디렉토리에서 확인할 수 있습니다.")


if __name__ == "__main__":
    main()
