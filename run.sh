#!/bin/bash

echo "========================================"
echo "호스피스 챗봇 시작"
echo "========================================"
echo ""

# 가상환경 활성화 확인
if [ -f "venv/bin/activate" ]; then
    echo "가상환경을 활성화합니다..."
    source venv/bin/activate
else
    echo "경고: 가상환경을 찾을 수 없습니다."
    read -p "계속하시겠습니까? (y/n): " continue
    if [ "$continue" != "y" ]; then
        exit 1
    fi
fi

# Ollama 실행 확인
echo ""
echo "Ollama 서비스 상태 확인 중..."
if ! command -v ollama &> /dev/null; then
    echo "오류: Ollama가 설치되지 않았습니다."
    echo "Ollama를 먼저 설치해주세요:"
    echo "curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

# Ollama 실행 확인
if ! ollama list &> /dev/null; then
    echo "오류: Ollama 서비스가 실행되지 않았습니다."
    echo "Ollama를 시작합니다..."
    ollama serve &
    sleep 3
fi

# 모델 확인
echo ""
echo "Qwen2.5 14B 모델 확인 중..."
if ! ollama list | grep -q "qwen2.5:14b"; then
    echo "경고: Qwen2.5 14B 모델을 찾을 수 없습니다."
    read -p "모델을 다운로드하시겠습니까? (y/n): " download
    if [ "$download" = "y" ]; then
        echo "모델 다운로드 중... (약 10분 소요)"
        ollama pull qwen2.5:14b
    else
        echo "모델 없이는 실행할 수 없습니다."
        exit 1
    fi
fi

# Python 앱 실행
echo ""
echo "========================================"
echo "챗봇을 시작합니다..."
echo "웹 브라우저에서 http://localhost:7860 을 열어주세요"
echo "========================================"
echo ""

python app.py
