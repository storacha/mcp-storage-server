import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), ".env") });

export interface ServerConfig {
  port: number;
  isStdioMode: boolean;
}

export function getServerConfig(isStdioMode: boolean): ServerConfig {
  return {
    port: parseInt(process.env.PORT || "3000", 10),
    isStdioMode
  };
} 