/**
 * Web-related tool handlers
 */

import { z } from "zod";
import { FetchUrlArgsSchema } from "../tools/schemas.js";
import { fetchUrl } from "../tools/url-fetcher.js";
import { ServerResult } from "../types.js";
import { createErrorResponse } from "../error-handlers.js";

export async function handleFetchUrl(
  args: unknown
): Promise<ServerResult> {
  try {
    const validatedArgs = FetchUrlArgsSchema.parse(args);
    const content = await fetchUrl(validatedArgs);
    
    // Create response with content
    return {
      content: [{ type: "text", text: content }],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Invalid arguments: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return createErrorResponse(`Failed to fetch URL: ${errorMessage}`);
  }
}