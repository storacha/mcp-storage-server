import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig } from '../../src/core/storage/config.js';

describe('Storage Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      PRIVATE_KEY: 'test-private-key',
      DELEGATION: 'test-delegation',
      GATEWAY_URL: 'https://test-gateway.link'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should load configuration from environment variables', () => {
    const config = loadConfig();
    expect(config).toEqual({
      privateKey: 'test-private-key',
      delegation: 'test-delegation',
      gatewayUrl: 'https://test-gateway.link'
    });
  });

  it('should use default gateway URL when not provided', () => {
    delete process.env.GATEWAY_URL;
    const config = loadConfig();
    expect(config.gatewayUrl).toBe('https://storacha.link');
  });

  it('should throw error when private key is missing', () => {
    delete process.env.PRIVATE_KEY;
    expect(() => loadConfig()).toThrow('PRIVATE_KEY environment variable is required');
  });

  it('should throw error when delegation is missing', () => {
    delete process.env.DELEGATION;
    expect(() => loadConfig()).toThrow('DELEGATION environment variable is required');
  });

  it('should handle empty string values as missing', () => {
    process.env.PRIVATE_KEY = '';
    expect(() => loadConfig()).toThrow('PRIVATE_KEY environment variable is required');

    process.env.PRIVATE_KEY = 'test-private-key';
    process.env.DELEGATION = '';
    expect(() => loadConfig()).toThrow('DELEGATION environment variable is required');
  });

  it('should trim whitespace from environment variables', () => {
    process.env.PRIVATE_KEY = '  test-private-key  ';
    process.env.DELEGATION = '  test-delegation  ';
    process.env.GATEWAY_URL = '  https://test-gateway.link  ';

    const config = loadConfig();
    expect(config).toEqual({
      privateKey: 'test-private-key',
      delegation: 'test-delegation',
      gatewayUrl: 'https://test-gateway.link'
    });
  });
}); 