import { describe, it, expect, vi } from 'vitest';
import { identityTool } from 'src/core/server/tools/identity.js';
import { StorageConfig } from 'src/core/storage/types.js';
import { Signer } from '@ucanto/principal/ed25519';

vi.mock('@ucanto/principal/ed25519', () => ({
  Signer: {
    parse: vi.fn()
  }
}));

describe('Identity Tool', () => {
  const mockDid = 'did:key:mock-did';
  const mockConfig: StorageConfig = {
    privateKey: 'test-private-key',
    delegation: 'test-delegation',
    gatewayUrl: 'https://test.gateway.com'
  };

  it('should return the agent DID when private key is available', async () => {
    const mockPrincipal = {
      did: () => mockDid,
    };
    vi.mocked(Signer.parse).mockReturnValue(mockPrincipal as any);

    const tool = identityTool(mockConfig);
    const result = await tool.handler();

    expect(result).toEqual({
      content: [{ type: 'text', text: JSON.stringify({ id: mockDid }) }]
    });
  });

  it('should handle missing private key error', async () => {
    const tool = identityTool({} as StorageConfig);
    const result = await tool.handler();

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Identity check failed: Private key is not defined in the storage config' }]
    });
  });

  it('should handle Signer.parse errors', async () => {
    const mockConfig = {
      privateKey: 'mock-private-key',
      delegation: 'mock-delegation'
    };

    vi.mocked(Signer.parse).mockImplementation(() => {
      throw new Error('Parse error');
    });

    const tool = identityTool(mockConfig);
    const result = await tool.handler();

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Identity check failed: Parse error' }]
    });
  });

  it('should handle unknown errors', async () => {
    const mockConfig = {
      privateKey: 'mock-private-key',
      delegation: 'mock-delegation'
    };

    vi.mocked(Signer.parse).mockImplementation(() => {
      throw 'Unknown error';
    });

    const tool = identityTool(mockConfig);
    const result = await tool.handler();

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Identity check failed: Unknown error' }]
    });
  });
}); 