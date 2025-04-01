import dotenv from 'dotenv';

dotenv.config();

/**
 * Integration test configuration
 * Provides test keys and delegation for integration tests
 */

// Valid test CID that can be used for retrieve tests
export const TEST_CID = 'bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y';

if (!process.env.PRIVATE_KEY || !process.env.DELEGATION) {
  throw new Error('PRIVATE_KEY and DELEGATION must be set');
}

// Test environment configuration
export const getTestEnv = () => ({
  ...process.env,
  NODE_ENV: 'test',
  PRIVATE_KEY: process.env.PRIVATE_KEY || '',
  DELEGATION: process.env.DELEGATION || '',
});
