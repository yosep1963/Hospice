# 적용 개요

아래 패치는 앞서 지적된 **오류, 성능, 유지보수성** 이슈를 한 번에 해결하도록 정리된 변경 사항입니다. 각 섹션을 그대로 복사해 파일을 생성/수정하시고, 마지막의 실행 방법을 따라 주세요.

## 변경 요약
- **서버(API) 정합성**: 문서 API 전면 구현(`list/search/get/content/download/upload/delete/summarize`), 응답 포맷 `{ success, data, error }`로 통일, MIME 타입 일관화.
- **프런트엔드 오류 수정**: DOM `document` 전역과 변수명 충돌 제거, 업로드 응답 파싱 불일치 해결, 문서 뷰어의 MIME 체크 보완, 채팅 파일 첨부 동작 구현.
- **오프라인 메시지 동기화**: Service Worker에서 POST 큐(IndexedDB)로 오프라인 전송 보강 및 백그라운드 재시도(sync).
- **성능/리팩터링**: 채팅 메시지 개행 처리 중복 제거, API 호출/에러 처리 공통화, 타입/상수 분리.
- **테스트 스캐폴딩**: Vitest 기반의 간단한 유닛 테스트 예시 추가.

---

# 1) `package.json` (루트)
> concurrently 미설치 및 스크립트 정리

```diff
{
  "name": "hospice-chatbot-pwa",
  "version": "1.3.3",
  "private": true,
  "type": "module",
  "scripts": {
-   "start": "concurrently \"npm run dev\" \"npm run server\"",
-   "dev": "vite",
-   "server": "node server/index.js",
+   "start": "concurrently \"npm run dev\" \"npm run server\"",
+   "dev": "vite",
+   "server": "node server/index.js",
+   "test": "vitest"
  },
  "dependencies": {
+   "cors": "^2.8.5",
+   "express": "^4.19.2",
+   "mime-types": "^2.1.35",
+   "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
+   "concurrently": "^9.0.1",
+   "vitest": "^2.0.5",
+   "@types/express": "^4.17.21",
+   "@types/multer": "^1.4.7",
+   "@types/mime-types": "^2.1.4"
  }
}
```

> **설명**: 서버/클라이언트 동시 실행을 위해 `concurrently` 추가. 서버에서 파일 업로드/다운로드, CORS, MIME 판별을 위해 의존성 추가. 테스트 명령 추가.

---

# 2) 서버: `server/index.js`
> 문서 API 전면 구현 및 응답 포맷 통일, MIME 타입 엄격화

```js
// server/index.js
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// 업로드 디렉토리
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 간단한 JSON 파일 기반 메타데이터 저장
const DB_FILE = path.join(__dirname, 'data', 'documents.json');
const DATA_DIR = path.dirname(DB_FILE);
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return [];
  }
}
function writeDB(docs) {
  fs.writeFileSync(DB_FILE, JSON.stringify(docs, null, 2));
}

// 업로드 설정
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const base = path.basename(file.originalname);
    cb(null, `${ts}__${base}`);
  }
});
const upload = multer({ storage });

function ok(data) {
  return { success: true, data };
}
function fail(error, code = 400) {
  return { success: false, error, code };
}

// 헬퍼: ID 생성
function newId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// [GET] 문서 목록
app.get('/api/documents', (_req, res) => {
  const docs = readDB();
  res.json(ok(docs));
});

// [GET] 검색: /api/documents/search?q=...
app.get('/api/documents/search', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const docs = readDB();
  const result = q
    ? docs.filter(d => d.name.toLowerCase().includes(q))
    : docs;
  res.json(ok(result));
});

// [GET] 문서 메타: /api/documents/:id
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json(fail('Document not found', 404));
  res.json(ok(doc));
});

// [GET] 문서 원본 스트림: /api/documents/:id/content
app.get('/api/documents/:id/content', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json(fail('Document not found', 404));
  const filePath = doc.path;
  if (!fs.existsSync(filePath)) return res.status(404).json(fail('File missing', 404));
  const mimeType = doc.type || mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  fs.createReadStream(filePath).pipe(res);
});

// [GET] 문서 다운로드: /api/documents/:id/download
app.get('/api/documents/:id/download', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const doc = docs.find(d => d.id === id);
  if (!doc) return res.status(404).json(fail('Document not found', 404));
  const filePath = doc.path;
  if (!fs.existsSync(filePath)) return res.status(404).json(fail('File missing', 404));
  res.download(filePath, doc.name);
});

// [POST] 업로드: multipart/form-data, field name: "file"
app.post('/api/documents/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json(fail('No file uploaded'));
  const original = req.file.originalname;
  const storedPath = req.file.path;
  const size = req.file.size;
  const detected = mime.lookup(original) || 'application/octet-stream';

  const docs = readDB();
  const id = newId();
  const meta = {
    id,
    name: original,
    type: detected,
    size,
    createdAt: new Date().toISOString(),
    path: storedPath
  };
  docs.push(meta);
  writeDB(docs);
  res.json(ok(meta));
});

// [DELETE] 문서 삭제
app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const docs = readDB();
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return res.status(404).json(fail('Document not found', 404));
  const [removed] = docs.splice(idx, 1);
  writeDB(docs);
  try { if (fs.existsSync(removed.path)) fs.unlinkSync(removed.path); } catch {}
  res.json(ok({ id }));
});

// [POST] 간단 요약(데모): 현재는 미구현 → 501
app.post('/api/documents/:id/summarize', (req, res) => {
  res.status(501).json(fail('Summary generation not implemented', 501));
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
```

---

# 3) 프런트 타입/상수: `src/types.ts`, `src/constants.ts`, `src/utils/mime.ts`

```ts
// src/types.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface DocumentMeta {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  createdAt: string;
  path?: string; // 서버 내부 경로(클라이언트에서 사용 안 함)
}

// PWA beforeinstallprompt 이벤트 타입(커스텀)
export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}
```

```ts
// src/constants.ts
export const API_BASE = '';
export const API = {
  DOCUMENTS: '/api/documents',
  SEARCH: '/api/documents/search',
  UPLOAD: '/api/documents/upload'
} as const;
```

```ts
// src/utils/mime.ts
export function extToMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.txt')) return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}
```

---

# 4) 공통 API 클라이언트: `src/api/client.ts`
> 에러 처리/응답 포맷 통합

```ts
// src/api/client.ts
import { API_BASE } from '../constants';
import type { ApiResponse } from '../types';

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const json = await res.json();
    return json as ApiResponse<T>;
  }
  if (!res.ok) {
    return { success: false, error: `HTTP ${res.status}` };
  }
  // JSON 이 아닌 경우(다운로드 등)
  return { success: true } as ApiResponse<T>;
}

async function get<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(API_BASE + url, { credentials: 'include' });
  return parseJson<T>(res);
}

async function post<T>(url: string, body: any, isForm = false): Promise<ApiResponse<T>> {
  const res = await fetch(API_BASE + url, {
    method: 'POST',
    body: isForm ? body : JSON.stringify(body),
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  return parseJson<T>(res);
}

async function del<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(API_BASE + url, { method: 'DELETE', credentials: 'include' });
  return parseJson<T>(res);
}

async function download(url: string): Promise<Blob> {
  const res = await fetch(API_BASE + url, { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}

export default { get, post, del, download };
```

---

# 5) 문서 처리 로직: `src/services/DocumentProcessor.ts`
> 업로드/다운로드 정합성, 변수명 충돌 제거

```ts
// src/services/DocumentProcessor.ts
import api from '../api/client';
import { API } from '../constants';
import type { DocumentMeta } from '../types';

export const DocumentProcessor = {
  async list(): Promise<DocumentMeta[]> {
    const res = await api.get<DocumentMeta[]>(API.DOCUMENTS);
    if (!res.success || !res.data) throw new Error(res.error || 'Failed to load documents');
    return res.data;
  },
  async search(q: string): Promise<DocumentMeta[]> {
    const res = await api.get<DocumentMeta[]>(`${API.SEARCH}?q=${encodeURIComponent(q)}`);
    if (!res.success || !res.data) throw new Error(res.error || 'Search failed');
    return res.data;
  },
  async get(id: string): Promise<DocumentMeta> {
    const res = await api.get<DocumentMeta>(`${API.DOCUMENTS}/${id}`);
    if (!res.success || !res.data) throw new Error(res.error || 'Fetch failed');
    return res.data;
  },
  async upload(file: File): Promise<DocumentMeta> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await api.post<DocumentMeta>(API.UPLOAD, fd, true);
    if (!res.success || !res.data) throw new Error(res.error || 'Upload failed');
    return res.data;
  },
  async download(id: string, filename?: string): Promise<void> {
    const blob = await api.download(`${API.DOCUMENTS}/${id}/download`);
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a'); // 전역 document 명시
    a.href = url;
    a.download = filename || '';
    a.style.display = 'none';
    window.document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    window.document.body.removeChild(a);
  },
  async remove(id: string): Promise<void> {
    const res = await api.del(`${API.DOCUMENTS}/${id}`);
    if (!res.success) throw new Error(res.error || 'Delete failed');
  },
  async summarize(id: string): Promise<string> {
    const res = await api.post<{ summary: string }>(`${API.DOCUMENTS}/${id}/summarize`, {});
    if (res.success && res.data?.summary) return res.data.summary;
    // 501 등 미구현 시 친절 메시지
    throw new Error(res.error || '요약 기능은 아직 지원되지 않습니다.');
  }
};
```

---

# 6) 문서 뷰어: `src/components/DocumentViewer.tsx`
> MIME 타입 기준으로 렌더링, PDF/이미지 처우 개선

```tsx
// src/components/DocumentViewer.tsx
import React from 'react';
import type { DocumentMeta } from '../types';

interface Props { doc: DocumentMeta | null }

const DocumentViewer: React.FC<Props> = ({ doc }) => {
  if (!doc) return <div className="text-sm text-gray-500">문서를 선택하세요.</div>;
  const isPdf = doc.type === 'application/pdf';
  const isImage = doc.type.startsWith('image/');

  const contentUrl = `/api/documents/${doc.id}/content`;

  if (isPdf) {
    return (
      <iframe title={doc.name} src={contentUrl} className="w-full h-[80vh] border rounded" />
    );
  }
  if (isImage) {
    return (
      <img src={contentUrl} alt={doc.name} className="max-w-full max-h-[80vh] object-contain" />
    );
  }
  return (
    <div className="text-sm text-gray-600">
      미리보기를 지원하지 않는 형식입니다. 다운로드하여 열어주세요.
    </div>
  );
};

export default DocumentViewer;
```

---

# 7) 채팅 입력(파일 첨부): `src/components/ChatInput.tsx`
> 파일 첨부 시 업로드 실행 및 상위로 콜백

```tsx
// src/components/ChatInput.tsx
import React, { useRef, useState } from 'react';
import { DocumentProcessor } from '../services/DocumentProcessor';
import type { DocumentMeta } from '../types';

interface Props {
  onSend: (text: string, attached?: DocumentMeta | null) => void;
}

const ChatInput: React.FC<Props> = ({ onSend }) => {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim(), null);
    setText('');
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const meta = await DocumentProcessor.upload(file);
      // 업로드 완료 후 메시지와 함께 연결(원하면 다운로드 링크를 메시지에 포함)
      onSend(`파일 업로드: ${meta.name}`, meta);
    } catch (err: any) {
      alert(`파일 업로드 실패: ${err.message || err}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        className="flex-1 border rounded px-3 py-2"
        placeholder="메시지를 입력하세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.key === 'Enter' ? submit() : null)}
      />
      <button
        className="border rounded px-3 py-2"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="파일 첨부"
      >📎</button>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      <button className="bg-black text-white rounded px-4 py-2" onClick={submit} disabled={uploading}>전송</button>
    </div>
  );
};

export default ChatInput;
```

---

# 8) 채팅 메시지 렌더(경미 성능 개선): `src/components/ChatMessage.tsx`
> 개행 split 중복 제거

```tsx
// src/components/ChatMessage.tsx
import React from 'react';

interface Props { content: string; role: 'user' | 'assistant' }

const ChatMessage: React.FC<Props> = ({ content, role }) => {
  const lines = content.split('\n');
  return (
    <div className={role === 'user' ? 'text-right' : 'text-left'}>
      {lines.map((ln, i) => (
        <p key={i} className="leading-relaxed whitespace-pre-wrap">{ln}</p>
      ))}
    </div>
  );
};

export default ChatMessage;
```

---

# 9) 서비스 워커(오프라인 동기화): `src/sw.ts`
> /api/chat/send POST 요청을 오프라인 큐에 저장 후 재시도

```ts
// src/sw.ts
/// <reference lib="webworker" />

// 간단 IndexedDB 큐 구현
const DB_NAME = 'hospice-sw';
const STORE = 'outbox';

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function outboxAdd(item: any) {
  const db = await idbOpen();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function outboxAll(): Promise<any[]> {
  const db = await idbOpen();
  return await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function outboxClearOne(id: string) {
  const db = await idbOpen();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // 오프라인 큐 대상: 채팅 전송 API
  if (url.pathname === '/api/chat/send' && request.method === 'POST') {
    event.respondWith((async () => {
      try {
        const res = await fetch(request.clone());
        return res; // 온라인 정상
      } catch {
        // 오프라인: 본문 저장
        const body = await request.clone().json().catch(() => null);
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        await outboxAdd({ id, url: request.url, body });
        // 백그라운드 동기화 등록(지원 브라우저 한정)
        // @ts-ignore
        const reg: ServiceWorkerRegistration = await self.registration;
        try { await reg.sync.register('sync-chat'); } catch {}
        return new Response(JSON.stringify({ success: true, queued: true }), { status: 202, headers: { 'Content-Type': 'application/json' } });
      }
    })());
  }
});

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-chat') {
    event.waitUntil((async () => {
      const items = await outboxAll();
      for (const it of items) {
        try {
          await fetch(it.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(it.body) });
          await outboxClearOne(it.id);
        } catch {
          // 네트워크 계속 실패: 다음 sync까지 보류
        }
      }
    })());
  }
});
```

> **주의**: Vite PWA 설정을 쓰는 경우, sw 파일 경로/등록 방법이 프로젝트 설정에 따라 다를 수 있습니다. 현재 sw가 `src/sw.ts`라면, 앱 엔트리에서 `navigator.serviceWorker.register('/sw.js')`로 빌드 산출물을 등록하는 설정이 맞는지 확인하세요.

---

# 10) 간단 테스트: `tests/mime.test.ts`, `tests/documentProcessor.test.ts`

```ts
// tests/mime.test.ts
import { describe, it, expect } from 'vitest';
import { extToMime } from '../src/utils/mime';

describe('extToMime', () => {
  it('pdf -> application/pdf', () => {
    expect(extToMime('a.pdf')).toBe('application/pdf');
  });
  it('png -> image/png', () => {
    expect(extToMime('a.png')).toBe('image/png');
  });
  it('unknown -> application/octet-stream', () => {
    expect(extToMime('a.bin')).toBe('application/octet-stream');
  });
});
```

```ts
// tests/documentProcessor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentProcessor } from '../src/services/DocumentProcessor';

const g: any = globalThis;

beforeEach(() => {
  g.fetch = vi.fn(async (url: string) => {
    if (typeof url === 'string' && url.includes('/api/documents')) {
      return {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ success: true, data: [] })
      } as any;
    }
    throw new Error('unknown url');
  });
});

describe('DocumentProcessor.list', () => {
  it('returns empty array when no docs', async () => {
    const docs = await DocumentProcessor.list();
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBe(0);
  });
});
```

---

# 실행 방법

1. 의존성 설치
   ```bash
   npm install
   ```
2. 서버/프런트 동시 실행
   ```bash
   npm start
   # 클라이언트: http://localhost:5173 (Vite 기본)
   # 서버:      http://localhost:5174
   ```
3. 테스트 실행(선택)
   ```bash
   npm run test
   ```

# 비고
- **요약 API**는 서버에서 `501 Not Implemented`로 응답하도록 명확히 했고, 프런트에서는 친절 에러 처리로 안내합니다(추후 실제 요약 엔진 연동 시 이 엔드포인트 구현만 대체하면 됩니다).
- 문서 타입 처리는 **MIME 기준**으로 일원화했습니다(서버가 MIME을 저장·반환). 프런트는 `application/pdf`, `image/*`에 기반해 뷰어 동작을 결정합니다.
- 채팅 파일 첨부 버튼은 **실제 업로드** 후 메시지에 결과를 연결하도록 구현했습니다.
- Service Worker는 **오프라인 전송 큐**를 통해 `/api/chat/send` POST를 저장/재시도합니다(해당 API가 서버에 존재해야 완전 동작).

필요 시 다음 단계로 **리스트 가상화(react-virtualized 등)**, **공유 타입 패키지(monorepo)**, **E2E 테스트(Playwright)** 도입을 권장합니다.

