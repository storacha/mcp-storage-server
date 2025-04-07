import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig } from '../../../src/core/storage/config.js';

// Mock the required dependencies
vi.mock('@ucanto/principal/ed25519', () => ({
  Signer: {
    parse: vi.fn().mockReturnValue({
      did: () => 'did:key:test',
      sign: vi.fn(),
      verify: vi.fn(),
      toArchive: vi.fn().mockReturnValue({
        did: 'did:key:test',
        key: new Uint8Array(),
      }),
    }),
  },
}));

vi.mock('../../../src/core/storage/utils.js', () => ({
  parseDelegation: vi.fn().mockResolvedValue({
    root: {
      did: () => 'did:key:test',
      sign: vi.fn(),
      verify: vi.fn(),
    },
  }),
}));

describe('Storage Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load configuration from environment variables', async () => {
    process.env.PRIVATE_KEY = 'MXByaXZhdGUta2V5'; // base64pad encoded "private-key"
    process.env.DELEGATION = 'test-delegation';
    process.env.GATEWAY_URL = 'https://test-gateway.url';

    const config = await loadConfig();
    expect(config.signer).toBeDefined();
    expect(config.delegation).toBeDefined();
    expect(config.gatewayUrl?.toString()).toBe('https://test-gateway.url/');
  });

  it('should use default gateway URL when not provided', async () => {
    process.env.PRIVATE_KEY = 'MXByaXZhdGUta2V5'; // base64pad encoded "private-key"
    process.env.DELEGATION = 'test-delegation';

    const config = await loadConfig();
    expect(config.gatewayUrl?.toString()).toBe('https://storacha.link/');
  });

  it('should throw error when private key is missing', async () => {
    // Ensure PRIVATE_KEY is not set
    delete process.env.PRIVATE_KEY;

    await expect(loadConfig()).rejects.toThrow('PRIVATE_KEY environment variable is required');
  });

  it('should throw error when delegation is missing', async () => {
    process.env.PRIVATE_KEY = 'MXByaXZhdGUta2V5'; // base64pad encoded "private-key"
    // Ensure DELEGATION is not set
    delete process.env.DELEGATION;

    await expect(loadConfig()).rejects.toThrow('DELEGATION environment variable is required');
  });

  it('should handle empty string values as missing', async () => {
    process.env.PRIVATE_KEY = '';
    process.env.DELEGATION = '';

    await expect(loadConfig()).rejects.toThrow('PRIVATE_KEY environment variable is required');
  });

  it('should trim whitespace from environment variables', async () => {
    process.env.PRIVATE_KEY = ' MXByaXZhdGUta2V5 '; // base64pad encoded "private-key" with whitespace
    process.env.DELEGATION = ' test-delegation ';
    process.env.GATEWAY_URL = ' https://test-gateway.url ';

    const config = await loadConfig();
    expect(config.signer).toBeDefined();
    expect(config.delegation).toBeDefined();
    expect(config.gatewayUrl?.toString()).toBe('https://test-gateway.url/');
  });
});
