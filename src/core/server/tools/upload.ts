import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { loadConfig } from '../../storage/config.js';

type UploadInput = {
  file: Buffer | string;
  name?: string;
  type?: string;
  retries?: number;
  gatewayUrl?: string;
  delegation?: string;
};

const uploadInputSchema = z.object({
  file:
    z.string()
      .refine((str) => {
        try {
          return Buffer.from(str, 'base64').toString('base64') === str;
        } catch {
          return false;
        }
      }, 'Invalid base64 string')
      .describe('The content of the file encoded as a base64 string'),
  name: z.string().optional().describe('Name for the uploaded file'),
  type: z.string().optional().describe('MIME type of the file'),
  delegation: z.string().optional().describe('Delegation proof (optional, will use the default delegation if not provided)'),
  gatewayUrl: z.string().optional().describe('Custom gateway URL (optional, will use the default gateway if not provided)'),
});

export const uploadTool = {
  name: 'upload',
  description: 'Upload a file to the Storacha Network. The file can be provided as raw binary data or a base64 encoded string. Returns the CID and URL of the uploaded file.',
  inputSchema: uploadInputSchema,
  handler: async (input: UploadInput, extra: any) => {
    try {
      // load config from env
      const config = loadConfig();
      const client = new StorachaClient({
        privateKey: config.privateKey,
        delegation: input.delegation || config.delegation,
        gatewayUrl: input.gatewayUrl || config.gatewayUrl,
      });
      await client.initialize();

      let fileData: string;
      let fileSize: number;

      if (Buffer.isBuffer(input.file)) {
        fileData = input.file.toString('base64');
        fileSize = input.file.length;
      } else {
        fileData = input.file;
        fileSize = Buffer.from(input.file, 'base64').length;
      }

      const result = await client.upload(fileData, input.name || 'unnamed-file', {
        type: input.type || 'application/octet-stream', // remove this default type
        retries: input.retries || 3
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            cid: result.cid, // FIXME: use root
            // FIXME: add paths
            // paths: [
            //   {
            //     cid: result.cid,
            //     path: input.name || 'unnamed-file'
            //   }
            // ],
            url: result.url,
            size: fileSize,
            type: input.type || 'application/octet-stream'
          })
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