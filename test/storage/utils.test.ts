import { describe, it, expect } from 'vitest';
import { detectMimeType } from '../../src/core/storage/utils.js';

describe('detectMimeType', () => {
  it('should detect common file types', () => {
    expect(detectMimeType('test.txt')).toBe('text/plain');
    expect(detectMimeType('image.png')).toBe('image/png');
    expect(detectMimeType('document.pdf')).toBe('application/pdf');
    expect(detectMimeType('script.js')).toBe('text/javascript');
    expect(detectMimeType('style.css')).toBe('text/css');
    expect(detectMimeType('data.json')).toBe('application/json');
  });

  it('should handle files without extensions', () => {
    expect(detectMimeType('README')).toBeUndefined();
    expect(detectMimeType('Dockerfile')).toBeUndefined();
  });

  it('should handle files with unknown extensions', () => {
    expect(detectMimeType('file.xyz')).toBe('chemical/x-xyz');
    expect(detectMimeType('data.unknown')).toBeUndefined();
  });

  it('should handle files with multiple dots', () => {
    expect(detectMimeType('archive.tar.gz')).toBe('application/gzip');
    expect(detectMimeType('script.min.js')).toBe('text/javascript');
  });

  it('should handle case-insensitive extensions', () => {
    expect(detectMimeType('image.PNG')).toBe('image/png');
    expect(detectMimeType('style.CSS')).toBe('text/css');
  });
}); 