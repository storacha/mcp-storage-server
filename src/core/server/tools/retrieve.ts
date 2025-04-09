import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { StorageConfig } from 'src/core/storage/types.js';
import * as dagJSON from '@ipld/dag-json';

type RetrieveInput = {
  filepath: string;
};

// Simplified schema that just validates that filepath is a non-empty string
// The actual parsing/validation happens in the client
const retrieveInputSchema = z.object({
  filepath: z
    .string()
    .min(1, 'Filepath cannot be empty')
    .describe(
      'The path to retrieve in format: CID/filename, /ipfs/CID/filename, or ipfs://CID/filename'
    ),
});

export const retrieveTool = (storageConfig: StorageConfig) => ({
  name: 'retrieve',
  description:
    'Retrieve a file from the Storacha Network. Supports formats: CID/filename, /ipfs/CID/filename, or ipfs://CID/filename.',
  inputSchema: retrieveInputSchema,
  handler: async (input: RetrieveInput) => {
    try {
      const client = new StorachaClient(storageConfig);
      const result = await client.retrieve(input.filepath);

      return {
        content: [
          {
            type: 'text' as const,
            text: dagJSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      console.error('Failed to retrieve resource:', error);
      return {
        content: [
          {
            error: true,
            type: 'text' as const,
            text: JSON.stringify({
              name: error instanceof Error ? error.name : 'Error',
              message: error instanceof Error ? error.message : 'Unknown error',
              cause: error instanceof Error && error.cause ? (error.cause as Error).message : null,
            }),
          },
        ],
      };
    }
  },
});
