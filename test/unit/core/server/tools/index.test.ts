import { describe, it, expect, vi } from 'vitest';
import { registerTools } from '../../../../../src/core/server/tools/index.js';
import { Signer } from '@ucanto/principal/ed25519';
import { Delegation, Capabilities } from '@ucanto/interface';

describe('Tool Registration', () => {
  it('should register all tools with the server', () => {
    // Mock the server
    const server = {
      tool: vi.fn(),
    };

    // Mock storage config
    const mockSigner = {
      did: () => 'did:key:mock',
      sign: vi.fn().mockResolvedValue(new Uint8Array()),
      verify: vi.fn().mockResolvedValue(true),
    } as unknown as Signer.EdSigner;

    const mockDelegation = {
      root: {
        did: () => 'did:key:mock',
        sign: vi.fn().mockResolvedValue(new Uint8Array()),
        verify: vi.fn().mockResolvedValue(true),
      },
    } as unknown as Delegation<Capabilities>;

    const mockStorageConfig = {
      signer: mockSigner,
      delegation: mockDelegation,
      gatewayUrl: new URL('https://test.gateway.com'),
    };

    // Register the tools
    registerTools(server as any, mockStorageConfig);

    // Verify that the server.tool method was called three times (once for each tool)
    expect(server.tool).toHaveBeenCalledTimes(3);

    // Verify calls for each tool
    expect(server.tool).toHaveBeenCalledWith(
      'identity',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );

    expect(server.tool).toHaveBeenCalledWith(
      'retrieve',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );

    expect(server.tool).toHaveBeenCalledWith(
      'upload',
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });
});
