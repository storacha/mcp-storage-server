import 'dotenv/config';
import { StorageConfig } from './types.js';

export const loadConfig = (): StorageConfig => {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const delegation = process.env.DELEGATION?.trim();
  const gatewayUrl = process.env.GATEWAY_URL?.trim() || 'https://storacha.link';

  return {
    privateKey,
    delegation: delegation || undefined,
    gatewayUrl
  };
};