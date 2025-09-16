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