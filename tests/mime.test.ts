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