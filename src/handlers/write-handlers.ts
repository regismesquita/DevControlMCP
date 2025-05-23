/**
 * Handler for write tool
 */

import { z } from 'zod';
import { ServerResult } from '../types.js';
import { WriteArgsSchema } from '../tools/schemas.js';
import { performBatchWrite } from '../tools/write-tool.js';
import { createErrorResponse } from '../error-handlers.js';

export async function handleWrite(args: unknown): Promise<ServerResult> {
  try {
    // Validate arguments
    const validatedArgs = WriteArgsSchema.parse(args);
    
    // Perform batch write operations
    const results = await performBatchWrite(validatedArgs);
    
    // Format results
    const formattedResults = results.map(result => {
      const parts = [`Operation: ${result.operation}`];
      
      if (result.path) {
        parts.push(`Path: ${result.path}`);
      }
      
      parts.push(`Status: ${result.success ? 'Success' : 'Failed'}`);
      
      if (result.error) {
        parts.push(`Error: ${result.error}`);
      }
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          parts.push(`${key}: ${value}`);
        });
      }
      
      return parts.join('\n');
    }).join('\n\n');
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    const summary = `Batch write completed: ${successCount} succeeded, ${failureCount} failed`;
    const content = `${summary}\n\n${formattedResults}`;
    
    return {
      content: [{ type: 'text', text: content }]
    };
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : String(error));
  }
}