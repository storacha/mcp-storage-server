import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig } from '../../../../src/core/server/config.js';

describe('Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should load configuration from environment variables', () => {
    process.env.MCP_SERVER_PORT = '3001';
    process.env.MCP_SERVER_HOST = 'localhost';
    process.env.MCP_CONNECTION_TIMEOUT = '30000';
    process.env.MCP_TRANSPORT_MODE = 'stdio';
    process.env.MAX_FILE_SIZE = '104857600';

    const config = loadConfig();
    expect(config).toEqual({
      port: 3001,
      host: 'localhost',
      connectionTimeoutMs: 30000,
      transportMode: 'stdio',
      maxFileSizeBytes: 1024 * 1024 * 100, // 100MB
    });
  });

  it('should use default values when environment variables are not set', () => {
    const config = loadConfig();
    expect(config).toEqual({
      port: 3001,
      host: '0.0.0.0',
      connectionTimeoutMs: 30000,
      transportMode: 'stdio',
      maxFileSizeBytes: 1024 * 1024 * 100, // 100MB
    });
  });

  it('should validate port number', () => {
    process.env.MCP_SERVER_PORT = 'invalid';
    expect(() => loadConfig()).toThrow('Invalid port number');

    process.env.MCP_SERVER_PORT = '-1';
    expect(() => loadConfig()).toThrow('Invalid port number');

    process.env.MCP_SERVER_PORT = '65536';
    expect(() => loadConfig()).toThrow('Invalid port number');
  });

  it('should validate transport mode', () => {
    process.env.MCP_TRANSPORT_MODE = 'invalid';
    expect(() => loadConfig()).toThrow('Invalid transport mode');
  });

  it('should validate connection timeout', () => {
    process.env.MCP_CONNECTION_TIMEOUT = 'invalid';
    expect(() => loadConfig()).toThrow('Invalid connection timeout');

    process.env.MCP_CONNECTION_TIMEOUT = '-1';
    expect(() => loadConfig()).toThrow('Invalid connection timeout');
  });

  it('should validate max file size', () => {
    process.env.MAX_FILE_SIZE = 'invalid';
    expect(() => loadConfig()).toThrow('Invalid max file size');

    process.env.MAX_FILE_SIZE = '-1';
    expect(() => loadConfig()).toThrow('Invalid max file size');
  });

  it('should handle empty string values', () => {
    process.env.MCP_SERVER_PORT = '';
    process.env.MCP_SERVER_HOST = '';
    process.env.MCP_CONNECTION_TIMEOUT = '';
    process.env.MCP_TRANSPORT_MODE = '';
    process.env.MAX_FILE_SIZE = '';

    const config = loadConfig();
    expect(config).toEqual({
      port: 3001,
      host: '0.0.0.0',
      connectionTimeoutMs: 30000,
      maxFileSizeBytes: 1024 * 1024 * 100, // 100MB
      transportMode: 'stdio',
    });
  });

  it('should trim whitespace from string values', () => {
    process.env.MCP_SERVER_HOST = '  localhost  ';
    process.env.MCP_TRANSPORT_MODE = '  stdio  ';

    const config = loadConfig();
    expect(config).toEqual({
      port: 3001,
      host: 'localhost',
      connectionTimeoutMs: 30000,
      maxFileSizeBytes: 1024 * 1024 * 100, // 100MB
      transportMode: 'stdio',
    });
  });
});
