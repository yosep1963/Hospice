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
        const reg = await (self as any).registration;
        try {
          // @ts-ignore - sync is not in standard types but exists in browsers that support it
          await reg.sync?.register('sync-chat');
        } catch {}
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