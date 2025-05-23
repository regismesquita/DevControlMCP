/**
 * Batched write operations tool implementation
 * Supports put, mkdir, copy, move, delete, and touch operations
 */

import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { WriteArgsSchema } from './schemas.js';
import { WriteResultItem } from '../types.js';
import { validatePath } from './filesystem.js';

/**
 * Handle put operation - write content to a file
 */
async function handlePut(
  operation: z.infer<typeof WriteArgsSchema>['operations'][0] & { type: 'put' }
): Promise<WriteResultItem> {
  try {
    const filePath = await validatePath(operation.path);
    
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Decode content if base64
    const content = operation.encoding === 'base64' 
      ? Buffer.from(operation.content, 'base64')
      : operation.content;
    
    // Write file
    if (operation.mode === 'append') {
      await fs.appendFile(filePath, content);
    } else {
      await fs.writeFile(filePath, content);
    }
    
    const stats = await fs.stat(filePath);
    
    return {
      operation: 'put',
      path: filePath,
      success: true,
      details: {
        bytes_written: stats.size,
        mode: operation.mode
      }
    };
  } catch (error) {
    return {
      operation: 'put',
      path: operation.path,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Handle mkdir operation - create directory
 */
async function handleMkdir(
  operation: z.infer<typeof WriteArgsSchema>['operations'][0] & { type: 'mkdir' }
): Promise<WriteResultItem> {
  try {
    const dirPath = await validatePath(operation.path);
    
    await fs.mkdir(dirPath, { recursive: operation.recursive });
    
    return {
      operation: 'mkdir',
      path: dirPath,
      success: true,
      details: {
        created: true,
        recursive: operation.recursive
      }
    };
  } catch (error) {
    return {
      operation: 'mkdir',
      path: operation.path,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Handle copy operation - copy file or directory
 */
async function handleCopy(
  operation: z.infer<typeof WriteArgsSchema>['operations'][0] & { type: 'copy' }
): Promise<WriteResultItem> {
  try {
    const sourcePath = await validatePath(operation.source);
    const destPath = await validatePath(operation.destination);
    
    // Check if destination exists and overwrite is false
    if (!operation.overwrite) {
      try {
        await fs.access(destPath);
        throw new Error(`Destination already exists: ${destPath}`);
      } catch (error: any) {
        // If error is not ENOENT, re-throw it
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    
    // Use fs-extra for robust copy operation
    await fsExtra.copy(sourcePath, destPath, { overwrite: operation.overwrite });
    
    return {
      operation: 'copy',
      path: destPath,
      success: true,
      details: {
        source: sourcePath,
        destination: destPath
      }
    };
  } catch (error) {
    return {
      operation: 'copy',
      path: operation.destination,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Handle move operation - move file or directory
 */
async function handleMove(
  operation: z.infer<typeof WriteArgsSchema>['operations'][0] & { type: 'move' }
): Promise<WriteResultItem> {
  try {
    const sourcePath = await validatePath(operation.source);
    const destPath = await validatePath(operation.destination);
    
    // Check if destination exists and overwrite is false
    if (!operation.overwrite) {
      try {
        await fs.access(destPath);
        throw new Error(`Destination already exists: ${destPath}`);
      } catch (error: any) {
        // If error is not ENOENT, re-throw it
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
    
    // Use fs-extra for robust move operation
    await fsExtra.move(sourcePath, destPath, { overwrite: operation.overwrite });
    
    return {
      operation: 'move',
      path: destPath,
      success: true,
      details: {
        source: sourcePath,
        destination: destPath
      }
    };
  } catch (error) {
    return {
      operation: 'move',
      path: operation.destination,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Handle delete operation - delete file or directory
 */
async function handleDelete(
  operation: z.infer<typeof WriteArgsSchema>['operations'][0] & { type: 'delete' }
): Promise<WriteResultItem> {
  try {
    const targetPath = await validatePath(operation.path);
    
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory() && !operation.recursive) {
      throw new Error('Cannot delete directory without recursive flag');
    }
    
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }
    
    return {
      operation: 'delete',
      path: targetPath,
      success: true,
      details: {
        deleted: true,
        was_directory: stats.isDirectory()
      }
    };
  } catch (error) {
    return {
      operation: 'delete',
      path: operation.path,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Handle touch operation - create empty file or update timestamps
 */
async function handleTouch(
  operation: z.infer<typeof WriteArgsSchema>['operations'][0] & { type: 'touch' }
): Promise<WriteResultItem> {
  try {
    const filePath = await validatePath(operation.path);
    
    const now = new Date();
    
    try {
      // Try to update timestamps if file exists
      await fs.utimes(filePath, now, now);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, '');
      } else {
        throw error;
      }
    }
    
    return {
      operation: 'touch',
      path: filePath,
      success: true,
      details: {
        touched: true,
        timestamp: now.toISOString()
      }
    };
  } catch (error) {
    return {
      operation: 'touch',
      path: operation.path,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Perform batch write operations
 */
export async function performBatchWrite(
  args: z.infer<typeof WriteArgsSchema>
): Promise<WriteResultItem[]> {
  const results: WriteResultItem[] = [];
  
  // Process each operation independently
  for (const operation of args.operations) {
    let result: WriteResultItem;
    
    switch (operation.type) {
      case 'put':
        result = await handlePut(operation);
        break;
      case 'mkdir':
        result = await handleMkdir(operation);
        break;
      case 'copy':
        result = await handleCopy(operation);
        break;
      case 'move':
        result = await handleMove(operation);
        break;
      case 'delete':
        result = await handleDelete(operation);
        break;
      case 'touch':
        result = await handleTouch(operation);
        break;
      default:
        // This should never happen due to discriminated union
        result = {
          operation: 'unknown',
          path: '',
          success: false,
          error: 'Unknown operation type'
        };
    }
    
    results.push(result);
  }
  
  return results;
}