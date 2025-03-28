import 'dotenv/config';
import { StorageConfig } from './types.js';

export const DEFAULT_GATEWAY_URL = 'https://storacha.link';

export const loadConfig = (): StorageConfig => {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  const delegation = process.env.DELEGATION?.trim();
  const gatewayUrl = process.env.GATEWAY_URL?.trim() || DEFAULT_GATEWAY_URL;

  return {
    privateKey,
    delegation: delegation || undefined,
    gatewayUrl
  };
};