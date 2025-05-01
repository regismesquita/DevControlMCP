import {
    readMultipleFiles,
    createDirectory,
    moveFile,
    getFileInfo,
    type FileResult,
    type MultiFileResult
} from '../tools/filesystem.js';

import { ServerResult } from '../types.js';
import { withTimeout } from '../utils.js';
import { createErrorResponse } from '../error-handlers.js';

import {
    ReadMultipleFilesArgsSchema,
    CreateDirectoryArgsSchema,
    MoveFileArgsSchema,
    GetFileInfoArgsSchema
} from '../tools/schemas.js';

// Helper functions removed as they were only used by the removed handlers

/**
 * Handle read_multiple_files command
 */
export async function handleReadMultipleFiles(args: unknown): Promise<ServerResult> {
    const parsed = ReadMultipleFilesArgsSchema.parse(args);
    const fileResults = await readMultipleFiles(parsed.paths);
    
    // Create a text summary of all files
    const textSummary = fileResults.map(result => {
        if (result.error) {
            return `${result.path}: Error - ${result.error}`;
        } else if (result.mimeType) {
            return `${result.path}: ${result.mimeType} ${result.isImage ? '(image)' : '(text)'}`;
        } else {
            return `${result.path}: Unknown type`;
        }
    }).join("\n");
    
    // Create content items for each file
    const contentItems: Array<{type: string, text?: string, data?: string, mimeType?: string}> = [];
    
    // Add the text summary
    contentItems.push({ type: "text", text: textSummary });
    
    // Add each file content
    for (const result of fileResults) {
        if (!result.error && result.content !== undefined) {
            if (result.isImage && result.mimeType) {
                // For image files, add an image content item
                contentItems.push({
                    type: "image",
                    data: result.content,
                    mimeType: result.mimeType
                });
            } else {
                // For text files, add a text summary
                contentItems.push({
                    type: "text",
                    text: `\n--- ${result.path} contents: ---\n${result.content}`
                });
            }
        }
    }
    
    return { content: contentItems };
}

/**
 * Handle create_directory command
 */
export async function handleCreateDirectory(args: unknown): Promise<ServerResult> {
    try {
        const parsed = CreateDirectoryArgsSchema.parse(args);
        await createDirectory(parsed.path);
        return {
            content: [{ type: "text", text: `Successfully created directory ${parsed.path}` }],
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createErrorResponse(errorMessage);
    }
}

/**
 * Handle move_file command
 */
export async function handleMoveFile(args: unknown): Promise<ServerResult> {
    try {
        const parsed = MoveFileArgsSchema.parse(args);
        await moveFile(parsed.source, parsed.destination);
        return {
            content: [{ type: "text", text: `Successfully moved ${parsed.source} to ${parsed.destination}` }],
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createErrorResponse(errorMessage);
    }
}

/**
 * Handle get_file_info command
 */
export async function handleGetFileInfo(args: unknown): Promise<ServerResult> {
    try {
        const parsed = GetFileInfoArgsSchema.parse(args);
        const info = await getFileInfo(parsed.path);
        return {
            content: [{ 
                type: "text", 
                text: Object.entries(info)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n') 
            }],
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return createErrorResponse(errorMessage);
    }
}

// The listAllowedDirectories function has been removed
// Use get_config to retrieve the allowedDirectories configuration
