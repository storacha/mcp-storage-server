import { z } from 'zod';
import { StorageConfig } from 'src/core/storage/types.js';

export const identityTool = (storageConfig: StorageConfig) => ({
  name: 'identity',
  description:
    'Returns the DID key of the Storacha agent loaded from the private key storage config.',
  inputSchema: z.object({}),
  handler: async () => {
    try {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ id: storageConfig.signer.did() }),
          },
        ],
      };
    } catch (error) {
      console.error('Error: handling identity:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              name: 'Error',
              message: `Identity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              cause: error instanceof Error ? (error.cause as Error | null) : null,
            }),
          },
        ],
      };
    }
  },
});
