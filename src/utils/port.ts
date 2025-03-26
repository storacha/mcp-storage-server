import { createServer } from 'net';

export function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(++startPort);
      } else {
        reject(err);
      }
    });

    server.on('listening', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });

    server.listen(startPort);
  });
} 