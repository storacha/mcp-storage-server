import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { detectMimeType, parseDelegation } from '../../storage/utils.js';
import { StorageConfig } from 'src/core/storage/types.js';

const uploadInputSchema = z.object({
  file: z
    .string()
    .refine(str => {
      // Remove any potential data URL prefix
      const cleanStr = str.replace(/^data:.*?;base64,/, '');
      return Buffer.from(cleanStr, 'base64').toString('base64') === cleanStr;
    }, 'Invalid base64 string')
    .describe('The content of the file encoded as a base64 string'),
  name: z
    .string()
    .describe('Name for the uploaded file (must include file extension for MIME type detection)'),
  type: z
    .string()
    .optional()
    .describe(
      'MIME type of the file (optional, will be inferred from file extension if not provided)'
    ),
  delegation: z
    .string()
    .optional()
    .describe(
      'Delegation proof (optional, will use the default server delegation if not provided)'
    ),
  gatewayUrl: z
    .string()
    .optional()
    .describe('Custom gateway URL (optional, will use the default gateway if not provided)'),
  publishToFilecoin: z
    .boolean()
    .optional()
    .describe(
      'Whether to publish the file to the Filecoin Network. When true, the file will be published to the Filecoin network, making it publicly accessible. When false (default), the file will only be available within the Storacha network.'
    ),
});

export const uploadTool = (storageConfig: StorageConfig) => ({
  name: 'upload',
  description:
    'Upload a file to the Storacha Network. The file must be provided as a base64 encoded string. The file name should include the extension (e.g., "document.pdf") to enable automatic MIME type detection.',
  inputSchema: uploadInputSchema,
  handler: async (input: z.infer<typeof uploadInputSchema>) => {
    try {
      // Validate that we have a delegation from either the request or config
      if (!input.delegation && !storageConfig.delegation) {
        throw new Error(
          'Delegation is required. Please provide it either in the request or via the DELEGATION environment variable.'
        );
      }

      const client = new StorachaClient({
        signer: storageConfig.signer,
        delegation: input.delegation
          ? await parseDelegation(input.delegation)
          : storageConfig.delegation,
        gatewayUrl: input.gatewayUrl ? new URL(input.gatewayUrl) : storageConfig.gatewayUrl,
      });
      await client.initialize();

      const type = input.type || detectMimeType(input.name);

      const result = await client.uploadFiles(
        [
          {
            name: input.name,
            content: input.file,
            type,
          },
        ],
        {
          retries: 3,
          publishToFilecoin: input.publishToFilecoin ?? false,
        }
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      console.error('Error: handling upload:', error);
      return {
        content: [
          {
            error: true,
            type: 'text' as const,
            text: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  },
});
