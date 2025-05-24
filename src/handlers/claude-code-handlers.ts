import { callClaudeCode } from '../tools/claude-code.js';
import { ClaudeCodeArgsSchema } from '../tools/schemas.js';
import { ServerResult } from '../types.js';
import { createErrorResponse } from '../error-handlers.js';

export async function handleClaudeCode(args: unknown): Promise<ServerResult> {
  try {
    const parsed = ClaudeCodeArgsSchema.parse(args);
    return await callClaudeCode(parsed.prompt, parsed.workFolder, parsed.tools);
  } catch (error: any) {
    // Zod validation errors will be caught here and formatted by createErrorResponse
    return createErrorResponse(`Invalid arguments for claude_code tool: ${error.message}`);
  }
}
