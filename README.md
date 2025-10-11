# 🏥 호스피스 챗봇 v1.0

호스피스 및 연명의료결정제도에 대한 RAG 기반 AI 상담 챗봇입니다.

## 📌 프로젝트 개요

이 챗봇은 **제공된 문서 내용만을 기반으로** 호스피스 및 연명의료결정제도에 대한 질문에 답변합니다. RAG (Retrieval-Augmented Generation) 기술을 사용하여 정확하고 신뢰할 수 있는 정보를 제공합니다.

### 주요 기능

- ✅ **문서 기반 답변**: 제공된 7개 문서의 내용만을 참조하여 답변
- ✅ **출처 표시**: 답변의 근거가 된 문서를 명확히 표시
- ✅ **로컬 실행**: 완전 오프라인 환경에서 작동 (데이터 유출 없음)
- ✅ **GPU 가속**: RTX 3090 Ti 최적화로 빠른 응답 속도 (CUDA 지원)
- ✅ **웹 UI**: Gradio 기반의 사용하기 쉬운 인터페이스
- ✅ **설정 파일**: YAML 기반 유연한 설정 관리
- ✅ **로깅 시스템**: 상세한 로그 및 에러 추적
- ✅ **성능 모니터링**: 내장 성능 테스트 도구

## 🎯 기술 스택

| 구성 요소 | 기술 |
|----------|------|
| **LLM** | Qwen2.5 14B Instruct |
| **임베딩** | BGE-M3 (다국어 한국어 최적화) |
| **벡터 DB** | ChromaDB |
| **LLM 서빙** | Ollama |
| **프레임워크** | LangChain |
| **웹 UI** | Gradio |

## 🚀 빠른 시작

### 1. 사전 요구사항

- Python 3.9+
- NVIDIA GPU (RTX 3090 Ti 권장)
- CUDA 11.8+

### 2. 설치

```bash
# 1. 저장소 클론 (또는 다운로드)
cd Hospice_3_chatbot

# 2. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate  # Windows

# 3. 패키지 설치
pip install -r requirements.txt

# 4. Ollama 설치
# Windows: https://ollama.ai 에서 다운로드
# Linux: curl -fsSL https://ollama.ai/install.sh | sh

# 5. 모델 다운로드
ollama pull qwen2.5:14b
```

### 3. 실행

#### 웹 인터페이스 (권장)

**Windows:**
```bash
# 가장 간단한 방법: START.bat 더블클릭
START.bat

# 또는 명령 프롬프트에서:
venv\Scripts\python.exe app.py
```

**Linux/Mac:**
```bash
python app.py
# 또는
./run.sh
```

브라우저에서 `http://localhost:7860` 접속

## 📂 프로젝트 구조

```
Hospice_3_chatbot/
├── data/                      # 문서 파일 (7개)
├── vector_db/                 # 벡터 데이터베이스
├── logs/                      # 로그 파일 (자동 생성)
├── src/
│   ├── document_loader.py     # 문서 로딩
│   ├── embeddings.py          # 벡터 임베딩
│   ├── rag_pipeline.py        # RAG 파이프라인
│   ├── chatbot.py             # 챗봇 로직
│   ├── config_loader.py       # 설정 관리
│   └── logger.py              # 로깅 시스템
├── app.py                     # Gradio 웹 UI
├── config.yaml                # 설정 파일 ⭐ NEW
├── init_vectordb.py           # 벡터 DB 초기화
├── performance_test.py        # 성능 테스트 ⭐ NEW
├── requirements.txt           # Python 의존성
├── run.bat                    # Windows 실행 스크립트 (개선됨)
├── setup_guide.md            # 상세 설치 가이드
├── USER_GUIDE.md             # 사용자 가이드 ⭐ NEW
└── README.md                 # 이 파일
```

## 💡 사용 방법

### 질문 예시

- "연명의료란 무엇인가요?"
- "임종과정에 있는 환자의 정의는 무엇인가요?"
- "사전연명의료의향서는 어떻게 작성하나요?"
- "연명의료계획서를 누가 작성할 수 있나요?"
- "DNR의 효력은 어떻게 되나요?"

### 답변 특징

- 문서에 있는 내용만 답변
- 문서에 없는 내용은 "제공된 문서에서 해당 정보를 찾을 수 없습니다"라고 안내
- 각 답변 하단에 참고 문서 출처 표시

## 🔧 설정 및 커스터마이징

### 다른 모델 사용

`src/chatbot.py`의 `model_name` 변경:

```python
chatbot = HospiceChatbot(
    model_name="qwen2.5:7b"  # 더 작은 모델
)
```

### 문서 추가/변경

1. `data/` 폴더에 .md 또는 .txt 파일 추가
2. `vector_db/` 폴더 삭제
3. 앱 재실행 (자동으로 벡터 DB 재구성)

### 프롬프트 수정

`src/rag_pipeline.py`의 `_create_prompt_template()` 메서드 수정

## 📊 성능

### RTX 3090 Ti 기준 (실측)

- **초기 로딩**: 18.33초 (벡터 DB 로드)
- **벡터 검색**: 36-336ms
- **응답 속도**: 평균 8.02초 (GPU 가속)
- **VRAM 사용량**: 약 0-2GB (임베딩만 GPU 사용)
- **정확도**: 문서 기반으로 높은 정확도

### 성능 테스트 실행

```bash
venv\Scripts\python.exe performance_test.py
```

출력 예시:
```
[OK] CUDA 사용 가능
[OK] GPU: NVIDIA GeForce RTX 3090 Ti
[성능] 평균 응답 시간: 8.02초
[메모리] 전체: 23.99 GB
```

## ⚠️ 주의사항

- 이 챗봇은 **교육 및 참고 목적**으로만 사용하세요
- 실제 의료 결정은 반드시 **의료진과 상담**하세요
- 법적 자문이 필요한 경우 **전문가와 상담**하세요
- 챗봇은 제공된 문서의 내용만을 기반으로 답변합니다

## 🔐 보안 및 프라이버시

- ✅ 완전 오프라인 실행 (인터넷 연결 불필요)
- ✅ 외부 API 호출 없음
- ✅ 데이터 외부 전송 없음
- ✅ 로컬 GPU에서만 처리

## 🛠️ 문제 해결

상세한 문제 해결 방법은 [setup_guide.md](setup_guide.md)를 참조하세요.

### 자주 발생하는 문제

**GPU 인식 안됨**
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

**Ollama 연결 오류**
```bash
ollama list  # Ollama 상태 확인
```

**메모리 부족**
- 더 작은 모델 사용: `ollama pull qwen2.5:7b`

## 📖 문서

- **빠른 시작**: [HOW_TO_RUN.txt](HOW_TO_RUN.txt) ⭐ **여기서 시작!**
- **프로젝트 개요**: 이 README.md
- **설치 가이드**: [setup_guide.md](setup_guide.md)
- **개발자 가이드**: [CLAUDE.md](CLAUDE.md)
- **설정 파일**: [config.yaml](config.yaml)

## 🆕 최신 업데이트 (v1.0)

### 주요 개선사항

1. **CUDA 지원 추가**
   - RTX 3090 Ti GPU 가속 활성화
   - PyTorch CUDA 11.8 설치
   - 평균 응답 속도 향상

2. **통합 로깅 시스템**
   - `logs/` 디렉토리에 자동 로그 저장
   - 일별 로그 파일 생성
   - 에러 전용 로그 분리

3. **설정 파일 시스템**
   - `config.yaml`로 모든 설정 관리
   - 모델, 포트, 파라미터 등 손쉽게 변경
   - 런타임에 설정 로드

4. **향상된 실행 스크립트**
   - 6단계 사전 검사 (Python, venv, CUDA, Ollama, 모델, 포트)
   - 자동 문제 해결 제안
   - 사용자 친화적인 메시지

5. **성능 테스트 도구**
   - `performance_test.py` 추가
   - GPU 사용률, 응답 시간, 메모리 사용량 측정
   - 벡터 검색 속도 벤치마크

6. **에러 처리 강화**
   - 모든 주요 함수에 try-except 추가
   - 상세한 에러 메시지
   - 자동 복구 시도

## 📈 향후 계획

- [ ] 대화 히스토리 저장 기능
- [ ] 더 많은 문서 포맷 지원 (PDF, DOCX)
- [ ] 다국어 지원
- [ ] 음성 입력/출력 기능
- [ ] REST API 제공

## 📄 라이선스

교육 및 연구 목적으로 자유롭게 사용 가능합니다.

## 🙏 기여

문제 발견 시 이슈를 등록하거나 개선 사항을 제안해주세요.

---

**제작**: Claude Code
**날짜**: 2025년
**버전**: 1.0.0
