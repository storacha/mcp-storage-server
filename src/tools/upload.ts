import { z } from 'zod';
import { StorachaClient } from '../storage/storage-client.js';

// Types
export type UploadInput = {
  file: Buffer | string;
  name?: string;
  type?: string;
  retries?: number;
  gatewayUrl?: string;
  privateKey: string;
  delegation: string;
};

// Zod Schema
export const uploadInputSchema = z.object({
  file: z.union([
    z.instanceof(Buffer).describe('Raw binary data'),
    z.string()
      .refine((str) => {
        try {
          return Buffer.from(str, 'base64').toString('base64') === str;
        } catch {
          return false;
        }
      }, 'Invalid base64 string')
      .describe('Base64 encoded string')
  ]).describe('The file to upload'),
  name: z.string().optional().describe('Name for the uploaded file'),
  type: z.string().optional().describe('MIME type of the file'),
  retries: z.number().optional().describe('Number of upload retries'),
  gatewayUrl: z.string().optional().describe('Custom gateway URL'),
  privateKey: z.string().describe('Private key for authentication'),
  delegation: z.string().describe('Delegation proof')
});

// Upload Tool Definition
export const uploadTool = {
  name: 'upload',
  description: 'Upload a file to the Storacha Network. The file can be provided as raw binary data or a base64 encoded string. Returns the CID and URL of the uploaded file.',
  inputSchema: uploadInputSchema,
  handler: async (input: UploadInput) => {
    try {
      const client = new StorachaClient({
        privateKey: input.privateKey,
        delegation: input.delegation,
        gatewayUrl: input.gatewayUrl
      });
      await client.initialize();

      // Handle file data
      let fileData: string;
      let fileSize: number;

      if (Buffer.isBuffer(input.file)) {
        fileData = input.file.toString('base64');
        fileSize = input.file.length;
      } else {
        fileData = input.file;
        fileSize = Buffer.from(input.file, 'base64').length;
      }

      // Upload file
      const result = await client.upload(fileData, input.name || 'unnamed-file', {
        type: input.type || 'application/octet-stream',
        retries: input.retries || 3
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            cid: result.cid,
            url: result.url,
            size: fileSize,
            type: input.type || 'application/octet-stream'
          })
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text",
          text: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
}; 