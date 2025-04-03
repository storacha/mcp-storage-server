import { describe, it, expect } from 'vitest';
import { detectMimeType } from '../../../src/core/storage/utils.js';

describe('detectMimeType', () => {
  it('should detect common file types', () => {
    expect(detectMimeType('document.pdf')).toBe('application/pdf');
    expect(detectMimeType('image.jpg')).toBe('image/jpeg');
    expect(detectMimeType('text.txt')).toBe('text/plain');
  });

  it('should handle files without extensions', () => {
    expect(detectMimeType('file')).toBeUndefined();
    expect(detectMimeType('data')).toBeUndefined();
  });

  it('should handle files with unknown extensions', () => {
    expect(detectMimeType('file.xyz')).toBe('chemical/x-xyz');
    expect(detectMimeType('data.unknown')).toBeUndefined();
  });

  it('should handle case-insensitive extensions', () => {
    expect(detectMimeType('document.PDF')).toBe('application/pdf');
    expect(detectMimeType('image.JPG')).toBe('image/jpeg');
  });

  it('should handle files with multiple dots', () => {
    expect(detectMimeType('archive.tar.gz')).toBe('application/gzip');
    expect(detectMimeType('script.min.js')).toBe('text/javascript');
  });

  it('should handle plain other files', () => {
    expect(detectMimeType('README.md')).toBe('text/markdown');
    expect(detectMimeType('config.json')).toBe('application/json');
    expect(detectMimeType('data.csv')).toBe('text/csv');
    expect(detectMimeType('log.txt')).toBe('text/plain');
    expect(detectMimeType('script.sh')).toBe('application/x-sh');
    expect(detectMimeType('style.css')).toBe('text/css');
  });

  it('should handle video files', () => {
    expect(detectMimeType('video.mp4')).toBe('application/mp4');
    expect(detectMimeType('movie.mov')).toBe('video/quicktime');
    expect(detectMimeType('clip.webm')).toBe('video/webm');
    expect(detectMimeType('animation.gif')).toBe('image/gif');
    expect(detectMimeType('presentation.avi')).toBe('video/x-msvideo');
  });

  it('should handle data analysis files', () => {
    expect(detectMimeType('dataset.parquet')).toBeUndefined();
    expect(detectMimeType('data.arrow')).toBeUndefined();
    expect(detectMimeType('table.orc')).toBeUndefined();
    expect(detectMimeType('stats.xlsx')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    expect(detectMimeType('analysis.ipynb')).toBe('application/x-ipynb+json');
  });

  it('should handle machine learning model files', () => {
    expect(detectMimeType('model.h5')).toBeUndefined();
    expect(detectMimeType('weights.pth')).toBeUndefined();
    expect(detectMimeType('model.onnx')).toBeUndefined();
    expect(detectMimeType('model.pb')).toBeUndefined();
    expect(detectMimeType('model.tflite')).toBeUndefined();
  });
});
