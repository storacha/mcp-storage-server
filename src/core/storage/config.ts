import 'dotenv/config';
import { StorageConfig } from './types.js';

export const loadConfig = (): StorageConfig => {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  const delegation = process.env.DELEGATION?.trim();
  const gatewayUrl = process.env.GATEWAY_URL?.trim() || 'https://storacha.link';

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  if (!delegation) {
    throw new Error('DELEGATION environment variable is required');
  }

  return {
    privateKey,
    delegation,
    gatewayUrl
  };
};