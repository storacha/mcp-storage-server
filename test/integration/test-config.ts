import dotenv from 'dotenv';

dotenv.config();

/**
 * Integration test configuration
 * Provides test keys and delegation for integration tests
 */

// Valid test CID that can be used for retrieve tests
export const TEST_CID = 'bafybeibv7vzycdcnydl5n5lbws6lul2omkm6a6b5wmqt77sicrwnhesy7y';

if (!process.env.TEST_PRIVATE_KEY || !process.env.TEST_DELEGATION) {
  throw new Error('TEST_PRIVATE_KEY and TEST_DELEGATION must be set');
}

// Test environment configuration
export const getTestEnv = () => ({
  ...process.env,
  NODE_ENV: 'test',
  PRIVATE_KEY: process.env.TEST_PRIVATE_KEY || '',
  DELEGATION: process.env.TEST_DELEGATION || '',
}); 