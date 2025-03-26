import { z } from 'zod';

export const helloTool = {
  name: "hello",
  description: "Greet the user",
  inputSchema: z.object({
    name: z.string().optional().describe("Name to greet"),
  }),
  handler: async (input: any, extra: any) => {
    try {
      const name = input?.name || "world";
      return {
        content: [
          {
            type: "text" as const,
            text: `Hello ${name}!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
};