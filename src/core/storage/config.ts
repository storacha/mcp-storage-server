import 'dotenv/config';
import { Signer } from '@ucanto/principal/ed25519';
import { StorageConfig } from './types.js';
import { parseDelegation } from './utils.js';

export const DEFAULT_GATEWAY_URL = 'https://storacha.link';

export const loadConfig = async (): Promise<StorageConfig> => {
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }
  const delegationStr = process.env.DELEGATION?.trim();
  if (!delegationStr) {
    throw new Error('DELEGATION environment variable is required');
  }

  const signer = Signer.parse(privateKey);
  const delegation = await parseDelegation(delegationStr);
  const gatewayUrl = new URL(process.env.GATEWAY_URL?.trim() || DEFAULT_GATEWAY_URL);

  return {
    signer,
    delegation,
    gatewayUrl,
  };
};
