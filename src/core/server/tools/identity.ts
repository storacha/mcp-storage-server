import { z } from 'zod';
import { Signer } from '@ucanto/principal/ed25519';
import { StorageConfig } from 'src/core/storage/types.js';

export const identityTool = (storageConfig: StorageConfig) => ({
  name: 'identity',
  description: 'Returns the DID key of the Storacha agent loaded from the private key storage config.',
  inputSchema: z.object({}),
  handler: async () => {
    try {
      if (!storageConfig.privateKey) {
        throw new Error('Private key is not defined in the storage config');
      }

      const principal = Signer.parse(storageConfig.privateKey);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ id: principal.did() })
        }]
      };
    } catch (error) {
      console.error("Error: handling identity:", error);
      return {
        content: [{
          type: "text" as const,
          text: `Identity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
}); 