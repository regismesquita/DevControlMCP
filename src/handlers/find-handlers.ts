/**
 * Handler for find tool
 */

import { z } from 'zod';
import { ServerResult } from '../types.js';
import { FindArgsSchema } from '../tools/schemas.js';
import { findEntries } from '../tools/find-tool.js';
import { createErrorResponse } from '../error-handlers.js';

export async function handleFind(args: unknown): Promise<ServerResult> {
  try {
    // Validate arguments
    const validatedArgs = FindArgsSchema.parse(args);
    
    // Find entries
    const entries = await findEntries(validatedArgs);
    
    // Format results
    const formattedResults = entries.map(entry => {
      const parts = [
        `Path: ${entry.path}`,
        `Type: ${entry.type}`,
      ];
      
      if (entry.size !== undefined) {
        parts.push(`Size: ${entry.size} bytes`);
      }
      
      if (entry.mime_type) {
        parts.push(`MIME: ${entry.mime_type}`);
      }
      
      if (entry.created) {
        parts.push(`Created: ${entry.created}`);
      }
      
      if (entry.modified) {
        parts.push(`Modified: ${entry.modified}`);
      }
      
      if (entry.permissions) {
        parts.push(`Permissions: ${entry.permissions}`);
      }
      
      return parts.join('\n');
    }).join('\n\n');
    
    const summary = `Found ${entries.length} matching entries`;
    const content = entries.length > 0 ? 
      `${summary}\n\n${formattedResults}` : 
      summary;
    
    return {
      content: [{ type: 'text', text: content }]
    };
  } catch (error) {
    return createErrorResponse(error instanceof Error ? error.message : String(error));
  }
}