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