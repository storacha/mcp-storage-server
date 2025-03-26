import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { loadConfig } from '../../storage/config.js';

type RetrieveInput = {
  cid: string;
};

const retrieveInputSchema = z.object({
  cid: z.string().describe('The CID of the file to retrieve'),
});

export const retrieveTool = {
  name: 'retrieve',
  description: 'Retrieve a file from the Storacha Network. Returns the file as a base64 encoded string.',
  inputSchema: retrieveInputSchema,
  handler: async (input: RetrieveInput, extra: any) => {
    try {
      const config = loadConfig();
      const client = new StorachaClient({
        privateKey: config.privateKey,
        delegation: config.delegation,
      });

      const result = await client.retrieve(input.cid);
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
          text: `Retrieve failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
}; 