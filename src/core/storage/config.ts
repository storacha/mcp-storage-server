import 'dotenv/config';
import { StorageConfig } from './types.js';

export const loadConfig = (): StorageConfig => {
  return {
    privateKey: process.env.PRIVATE_KEY,
    delegation: process.env.DELEGATION,
    gatewayUrl: process.env.GATEWAY_URL,
  };
};