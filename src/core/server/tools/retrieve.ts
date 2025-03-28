import { z } from 'zod';
import { StorachaClient } from '../../storage/client.js';
import { loadConfig } from '../../storage/config.js';

type RetrieveInput = {
  root: string;
};

const retrieveInputSchema = z.object({
  root: z.string().describe('The root CID of the directory where the file(s) to retrieve are stored')
});

export const retrieveTool = {
  name: 'retrieve',
  description: 'Retrieve a file from the Storacha Network using its root CID (CID of the directory where the file(s) to retrieve are stored). The file will be retrieved from the configured gateway URL.',
  inputSchema: retrieveInputSchema,
  handler: async (input: RetrieveInput, extra: any) => {
    try {
      // load config from env
      const config = loadConfig();

      const client = new StorachaClient({
        privateKey: config.privateKey,
        delegation: config.delegation,
        gatewayUrl: config.gatewayUrl,
      });

      const result = await client.retrieve(input.root);

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