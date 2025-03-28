import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { identityTool } from '../../../../src/core/server/tools/identity.js';
import { loadConfig } from '../../../../src/core/storage/config.js';
import { Signer } from '@ucanto/principal/ed25519';

// Mock dependencies
vi.mock('../../../../src/core/storage/config.js');
vi.mock('@ucanto/principal/ed25519', () => ({
  Signer: {
    parse: vi.fn().mockReturnValue({ did: () => 'did:key:mock' })
  }
}));

describe('Identity Tool', () => {
  const mockConfig = {
    privateKey: 'test-private-key',
    delegation: 'test-delegation',
    gatewayUrl: 'https://test-gateway.url'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadConfig).mockReturnValue(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return the agent DID when private key is available', async () => {
    const result = await identityTool.handler();

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: JSON.stringify({ id: 'did:key:mock' })
      }]
    });
  });

  it('should handle missing private key error', async () => {
    vi.mocked(loadConfig).mockReturnValue({
      privateKey: undefined,
      delegation: 'test-delegation',
      gatewayUrl: 'https://test-gateway.url'
    });

    const result = await identityTool.handler();

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Identity check failed: Private key is not defined in the storage config'
      }]
    });
  });

  it('should handle Signer.parse errors', async () => {
    vi.mocked(Signer.parse).mockImplementation(() => {
      throw new Error('Invalid private key format');
    });

    const result = await identityTool.handler();

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Identity check failed: Invalid private key format'
      }]
    });
  });

  it('should handle unknown errors', async () => {
    vi.mocked(Signer.parse).mockImplementation(() => {
      throw 'Unknown error object';
    });

    const result = await identityTool.handler();

    expect(result).toEqual({
      content: [{
        type: 'text',
        text: 'Identity check failed: Unknown error'
      }]
    });
  });
}); 