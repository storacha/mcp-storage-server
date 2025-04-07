import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { StorageConfig } from 'src/core/storage/types.js';
import { isValidCID } from 'src/core/storage/utils.js';

type RetrieveInput = {
  filepath: string;
};

// Validate that the input is in the format "root cid/filename"
// The filename part must be present for retrieval to work
const retrieveInputSchema = z.object({
  filepath: z
    .string()
    .describe('The path to retrieve in format: root CID/filename (e.g., bafyxyz/image.jpg)')
    .refine(
      value => {
        // If it is not a valid root CID it must contain a slash separator between CID and filename
        if (!value.includes('/')) {
          return false;
        }

        const parts = value.split('/');
        const cid = parts[0];
        const filename = parts[1];

        // Both CID and filename must be valid
        return isValidCID(cid) && filename.trim().length > 0;
      },
      {
        message:
          'Invalid format. Must be in the format root CID/filename (root CID followed by slash and filename).',
      }
    ),
});

export const retrieveTool = (storageConfig: StorageConfig) => ({
  name: 'retrieve',
  description:
    'Retrieve a file from the Storacha Network using the format root CID/filename. The filename must be specified after the CID with a slash separator.',
  inputSchema: retrieveInputSchema,
  handler: async (input: RetrieveInput) => {
    try {
      const client = new StorachaClient(storageConfig);
      const result = await client.retrieve(input.filepath);

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
