# 호스피스 챗봇 설치 및 실행 가이드

호스피스 및 연명의료결정제도 RAG 챗봇 설치 및 사용 방법을 안내합니다.

## 📋 시스템 요구사항

- **OS**: Windows 10/11, Linux, macOS
- **GPU**: NVIDIA RTX 3090 Ti (24GB VRAM) 또는 그 이상
- **Python**: 3.9 이상
- **CUDA**: 11.8 이상 (GPU 사용 시)
- **메모리**: 최소 16GB RAM
- **저장공간**: 최소 30GB 여유 공간

## 🚀 설치 단계

### 1. Python 가상환경 설정

```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

### 2. 필수 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. Ollama 설치

#### Windows
1. [Ollama 공식 사이트](https://ollama.ai)에서 Windows 인스톨러 다운로드
2. 설치 프로그램 실행
3. 설치 완료 후 터미널 재시작

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### macOS
```bash
brew install ollama
```

### 4. Qwen2.5 14B 모델 다운로드

```bash
ollama pull qwen2.5:14b
```

**참고**: 모델 다운로드에는 약 8-10GB의 저장공간과 시간이 소요됩니다.

### 5. 모델 동작 확인

```bash
ollama run qwen2.5:14b
```

정상적으로 실행되면 대화 인터페이스가 나타납니다. `/bye`를 입력하여 종료할 수 있습니다.

## 🎯 실행 방법

### 방법 1: 웹 인터페이스 (권장)

```bash
python app.py
```

브라우저에서 `http://localhost:7860` 접속

### 방법 2: 터미널 인터페이스

```bash
cd src
python chatbot.py
```

### 방법 3: 스크립트 실행 (Windows)

```bash
run.bat
```

### 방법 4: 스크립트 실행 (Linux/Mac)

```bash
chmod +x run.sh
./run.sh
```

## 📂 프로젝트 구조

```
Hospice_3_chatbot/
├── data/                    # 원본 문서 파일 (7개)
│   ├── hospice_1_1_1.md
│   ├── hospice_1_1_2.md
│   ├── hospice_1_2.md
│   ├── hospice_1_3.md
│   ├── hospice_2_1.txt
│   ├── hospice_2_2.txt
│   └── hospice_2_3.txt
├── vector_db/              # 벡터 데이터베이스 (자동 생성)
├── src/
│   ├── document_loader.py  # 문서 로딩
│   ├── embeddings.py       # 임베딩 생성
│   ├── rag_pipeline.py     # RAG 파이프라인
│   └── chatbot.py          # 챗봇 로직
├── app.py                  # Gradio 웹 UI
├── requirements.txt        # Python 의존성
├── setup_guide.md         # 이 파일
├── run.bat                # Windows 실행 스크립트
└── run.sh                 # Linux/Mac 실행 스크립트
```

## 🔧 문제 해결

### GPU 인식 안됨

```bash
# PyTorch CUDA 버전 확인
python -c "import torch; print(torch.cuda.is_available())"
```

False가 나오면 CUDA 호환 PyTorch 재설치:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Ollama 연결 오류

```bash
# Ollama 서비스 상태 확인
ollama list

# Ollama 재시작
# Windows: 작업 관리자에서 Ollama 종료 후 재실행
# Linux/Mac:
systemctl restart ollama
```

### 메모리 부족 오류

- `rag_pipeline.py`에서 `num_ctx` 값을 낮춤 (4096 → 2048)
- 더 작은 모델 사용: `qwen2.5:7b` 또는 `qwen2.5:3b`

```bash
ollama pull qwen2.5:7b
```

그 후 `chatbot.py`의 `model_name` 변경

### 벡터 DB 재구성

문서를 변경했다면:

```bash
# vector_db 폴더 삭제
rm -rf vector_db  # Linux/Mac
rmdir /s vector_db  # Windows

# 앱 재실행 (자동으로 재구성됨)
python app.py
```

## 💡 사용 팁

1. **첫 실행 시**: 벡터 DB 생성에 5-10분 소요됩니다
2. **질문 작성**: 구체적이고 명확한 질문이 더 정확한 답변을 얻습니다
3. **문서 출처**: 각 답변 하단에 참고 문서가 표시됩니다
4. **문서 추가**: `data/` 폴더에 .md 또는 .txt 파일 추가 후 벡터 DB 재구성

## 📊 성능 최적화

### RTX 3090 Ti 최적 설정

현재 설정이 RTX 3090 Ti (24GB)에 최적화되어 있습니다:
- 모델: Qwen2.5 14B (약 16-18GB VRAM 사용)
- 임베딩: BGE-M3 (GPU 가속)
- 배치 크기: 청크 1000자

### 다른 GPU 사용 시

**RTX 4090 (24GB)**
- 현재 설정 그대로 사용 가능
- 더 빠른 응답 속도 기대

**RTX 3080/3080Ti (10-12GB)**
```bash
ollama pull qwen2.5:7b  # 더 작은 모델 사용
```

**RTX 3060 (12GB)**
```bash
ollama pull qwen2.5:3b  # 경량 모델 사용
```

## 🔐 보안 및 주의사항

- 이 챗봇은 **오프라인**에서 실행되며 외부로 데이터를 전송하지 않습니다
- 제공된 문서 내용만을 기반으로 답변합니다
- 실제 의료 결정은 반드시 의료진과 상담하세요
- 법적 자문이 필요한 경우 전문가와 상담하세요

## 📞 문의 및 지원

문제가 발생하면 다음을 확인하세요:

1. Python 버전: `python --version`
2. CUDA 버전: `nvidia-smi`
3. Ollama 상태: `ollama list`
4. 패키지 설치: `pip list`

## 🔄 업데이트

### 모델 업데이트
```bash
ollama pull qwen2.5:14b
```

### 패키지 업데이트
```bash
pip install --upgrade -r requirements.txt
```

---

**즐거운 사용 되세요!** 🎉
