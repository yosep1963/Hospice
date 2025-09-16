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