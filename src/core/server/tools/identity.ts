import { z } from 'zod';
import { loadConfig } from '../../storage/config.js';
import { Signer } from '@ucanto/principal/ed25519';

export const identityTool = {
  name: 'identity',
  description: 'Returns the DID key of the Storacha agent loaded from the private key storage config.',
  inputSchema: z.object({}),
  handler: async () => {
    try {
      const config = loadConfig();
      
      if (!config.privateKey) {
        throw new Error('Private key is not defined in the storage config');
      }

      const principal = Signer.parse(config.privateKey);
      const did = principal.did();

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({ did })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `Identity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
}; 