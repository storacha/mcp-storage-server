import { describe, it, expect, vi } from 'vitest';
import { identityTool } from '../../../../src/core/server/tools/identity.js';
import { Signer } from '@ucanto/principal/ed25519';
import { Delegation, Capabilities } from '@ucanto/interface';

const mockSigner = {
  did: () => 'did:key:mock',
  sign: vi.fn().mockResolvedValue(new Uint8Array()),
  verify: vi.fn().mockResolvedValue(true)
} as unknown as Signer.EdSigner;

const mockDelegation = {
  root: {
    did: () => 'did:key:mock',
    sign: vi.fn().mockResolvedValue(new Uint8Array()),
    verify: vi.fn().mockResolvedValue(true)
  }
} as unknown as Delegation<Capabilities>;

const mockConfig = {
  signer: mockSigner,
  delegation: mockDelegation,
  gatewayUrl: new URL('https://test.gateway.com')
};

describe('identityTool', () => {
  it('should return the DID key', async () => {
    const tool = identityTool(mockConfig);
    const result = await tool.handler();
    expect(result).toEqual({
      content: [{
        type: "text",
        text: JSON.stringify({ id: 'did:key:mock' })
      }]
    });
  });

}); 