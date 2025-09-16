# Hospice Care Assistant PWA

## Version 1.3.3

A Progressive Web Application for hospice care support and information assistance with enhanced document management and offline capabilities.

## ✨ New in v1.3.3

### 🚀 Major Updates
- **완전한 문서 API**: 업로드, 다운로드, 검색, 삭제, 요약 기능
- **파일 첨부 기능**: 채팅에서 직접 파일 업로드 및 공유
- **오프라인 동기화**: 네트워크 연결이 끊어져도 메시지 큐잉
- **MIME 타입 지원**: PDF, 이미지 등 다양한 파일 형식 처리
- **향상된 에러 처리**: 통일된 API 응답 형식과 사용자 친화적 에러 메시지

### 🔧 기술적 개선
- **타입 안전성 강화**: 새로운 TypeScript 타입 정의
- **API 클라이언트 통합**: 중앙 집중식 HTTP 요청 처리
- **Service Worker 최적화**: IndexedDB 기반 오프라인 큐
- **테스트 환경**: Vitest 기반 유닛 테스트 구축

## Features

- 💬 **AI 채팅**: 호스피스 케어 관련 질문 응답
- 📄 **문서 관리**: 파일 업로드, 다운로드, 검색, 미리보기
- 📎 **파일 첨부**: 채팅 중 실시간 파일 공유
- 📱 **PWA 지원**: 오프라인 기능과 앱 설치
- 🔄 **오프라인 동기화**: 네트워크 복구 시 자동 메시지 전송
- 🔒 **보안**: 안전한 파일 업로드와 MIME 타입 검증
- 📲 **반응형 디자인**: 모바일 최적화
- 🌐 **크로스 플랫폼**: 브라우저 호환성

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Development 모드 실행:
```bash
npm start
```
이 명령어는 프론트엔드(http://localhost:5173)와 백엔드(http://localhost:5174)를 동시에 실행합니다.

### Development Commands

```bash
# 프론트엔드와 백엔드 동시 실행
npm start

# 프론트엔드만 실행
npm run dev

# 백엔드만 실행
npm run server

# 테스트 실행
npm run test

# 프로덕션 빌드
npm run build

# 린터 실행
npm run lint
```

## 📁 Project Structure

```
hospice-chatbot-pwa/
├── src/
│   ├── components/     # React 컴포넌트
│   │   ├── ChatInput.tsx      # 파일 첨부 기능 포함
│   │   ├── ChatMessage.tsx    # 메시지 렌더링
│   │   └── DocumentViewer.tsx # 문서 미리보기
│   ├── pages/          # 페이지 컴포넌트
│   ├── services/       # 비즈니스 로직
│   │   └── DocumentProcessor.ts
│   ├── api/           # API 클라이언트
│   │   └── client.ts
│   ├── types/         # TypeScript 타입
│   │   └── types.ts
│   ├── utils/         # 유틸리티
│   │   └── mime.ts
│   ├── constants.ts   # 상수 정의
│   └── sw.ts         # Service Worker
├── server/            # Express 백엔드
│   ├── index.js      # 메인 서버 파일
│   ├── uploads/      # 업로드된 파일
│   └── data/         # JSON 데이터베이스
├── tests/            # 테스트 파일
├── public/           # 정적 파일
└── dist/            # 빌드 결과
```

## 🔧 Technologies Used

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation

### Backend
- Express.js with ES modules
- Multer for file uploads
- CORS support
- MIME type detection

### PWA & Offline
- Service Worker with fetch interception
- IndexedDB for offline message queue
- Background sync for message retry

### Testing
- Vitest for unit testing
- TypeScript support in tests

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
npm run server
```

### Docker (Optional)
```bash
docker build -t hospice-pwa .
docker run -p 5174:5174 hospice-pwa
```

## 📋 API Endpoints

### Documents
- `GET /api/documents` - 문서 목록
- `GET /api/documents/search?q=검색어` - 문서 검색
- `GET /api/documents/:id` - 문서 메타데이터
- `GET /api/documents/:id/content` - 문서 원본
- `GET /api/documents/:id/download` - 문서 다운로드
- `POST /api/documents/upload` - 문서 업로드
- `DELETE /api/documents/:id` - 문서 삭제
- `POST /api/documents/:id/summarize` - 문서 요약 (미구현)

### Chat
- `POST /api/chat/send` - 메시지 전송

## 🔒 Security Features

- MIME 타입 검증으로 악성 파일 차단
- 파일 크기 제한
- 안전한 파일 저장 경로
- CORS 설정
- XSS 방지

## 📱 PWA Features

- 오프라인 메시지 큐잉
- 백그라운드 동기화
- 앱 설치 가능
- 푸시 알림 준비 (향후 구현)

## 🧪 Testing

```bash
# 모든 테스트 실행
npm run test

# 특정 테스트 파일 실행
npx vitest tests/mime.test.ts

# 테스트 커버리지
npx vitest --coverage
```

## 📝 Usage Examples

### 파일 업로드
```typescript
import { DocumentProcessor } from './src/services/DocumentProcessor';

const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
const document = await DocumentProcessor.upload(file);
```

### 문서 검색
```typescript
const results = await DocumentProcessor.search('hospice care');
```

## License

MIT
