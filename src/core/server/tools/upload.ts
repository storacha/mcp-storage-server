import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { loadConfig } from '../../storage/config.js';
import { detectMimeType } from '../../storage/utils.js';

const uploadInputSchema = z.object({
  file:
    z.string()
      .refine((str) => Buffer.from(str, 'base64').toString('base64') === str, 'Invalid base64 string')
      .describe('The content of the file encoded as a base64 string'),
  name: z.string().describe('Name for the uploaded file (must include file extension for MIME type detection)'),
  type: z.string().optional().describe('MIME type of the file (optional, will be inferred from file extension if not provided)'),
  delegation: z.string().optional().describe('Delegation proof (optional, will use the default server delegation if not provided)'),
  gatewayUrl: z.string().optional().describe('Custom gateway URL (optional, will use the default gateway if not provided)'),
  publishToIPFS: z.boolean().optional().describe('Whether to publish the file to IPFS. When true, the file will be published to the IPFS network, making it publicly accessible. When false (default), the file will only be available within the Storacha network.'),
});

export const uploadTool = {
  name: 'upload',
  description: 'Upload a file to the Storacha Network. The file must be provided as a base64 encoded string. The file name should include the extension (e.g., "document.pdf") to enable automatic MIME type detection. The file can be optionally published to IPFS using the publishToIPFS parameter. When publishToIPFS is true, the file will be published to the IPFS network, making it publicly accessible. When false (default), the file will only be available within the Storacha network. Returns the CID and URL of the uploaded file.',
  inputSchema: uploadInputSchema,
  handler: async (input: z.infer<typeof uploadInputSchema>, extra: any) => {
    try {
      // load config from env
      const config = loadConfig();

      // Validate that we have a delegation from either the request or config
      if (!input.delegation && !config.delegation) {
        throw new Error('Delegation is required. Please provide it either in the request or via the DELEGATION environment variable.');
      }

      const client = new StorachaClient({
        privateKey: config.privateKey,
        delegation: input.delegation || config.delegation,
        gatewayUrl: input.gatewayUrl || config.gatewayUrl,
      });
      await client.initialize();

      const type = input.type || detectMimeType(input.name);

      const result = await client.uploadFiles([{
        name: input.name,
        content: input.file,
        type,
      }], {
        retries: 3,
        publishToIPFS: input.publishToIPFS
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
}; 