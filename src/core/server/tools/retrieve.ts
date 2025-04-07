import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { StorageConfig } from 'src/core/storage/types.js';

type RetrieveInput = {
  root: string;
};

const retrieveInputSchema = z.object({
  root: z
    .string()
    .describe('The root CID of the directory where the file(s) to retrieve are stored'),
});

export const retrieveTool = (storageConfig: StorageConfig) => ({
  name: 'retrieve',
  description:
    'Retrieve a file from the Storacha Network using its root CID (CID of the directory where the file(s) to retrieve are stored). The file will be retrieved from the configured gateway URL.',
  inputSchema: retrieveInputSchema,
  handler: async (input: RetrieveInput) => {
    try {
      const client = new StorachaClient(storageConfig);
      const result = await client.retrieve(input.root);

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      console.error('Error: handling retrieve:', error);
      return {
        content: [
          {
            error: true,
            type: 'text' as const,
            text: JSON.stringify({
              name: 'Error',
              message: `Retrieve failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              cause: error instanceof Error ? (error.cause as Error | null) : null,
            }),
          },
        ],
      };
    }
  },
});
