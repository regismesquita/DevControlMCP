import fs from "fs/promises";
import path from "path";
import os from 'os';
import {withTimeout} from '../utils.js';
import {configManager} from '../config-manager.js';

// Initialize allowed directories from configuration
async function getAllowedDirs(): Promise<string[]> {
    try {
        let allowedDirectories;
        const config = await configManager.getConfig();
        if (config.allowedDirectories && Array.isArray(config.allowedDirectories)) {
            allowedDirectories = config.allowedDirectories;
        } else {
            // Fall back to default directories if not configured
            allowedDirectories = [
                os.homedir()   // User's home directory
            ];
            // Update config with default
            await configManager.setValue('allowedDirectories', allowedDirectories);
        }
        return allowedDirectories;
    } catch (error) {
        console.error('Failed to initialize allowed directories:', error);
        // Keep the default permissive path
    }
    return [];
}

// Normalize all paths consistently
function normalizePath(p: string): string {
    return path.normalize(expandHome(p)).toLowerCase();
}

function expandHome(filepath: string): string {
    if (filepath.startsWith('~/') || filepath === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

/**
 * Recursively validates parent directories until it finds a valid one
 * This function handles the case where we need to create nested directories
 * and we need to check if any of the parent directories exist
 * 
 * @param directoryPath The path to validate
 * @returns Promise<boolean> True if a valid parent directory was found
 */
async function validateParentDirectories(directoryPath: string): Promise<boolean> {
    const parentDir = path.dirname(directoryPath);
    
    // Base case: we've reached the root or the same directory (shouldn't happen normally)
    if (parentDir === directoryPath || parentDir === path.dirname(parentDir)) {
        return false;
    }

    try {
        // Check if the parent directory exists
        await fs.realpath(parentDir);
        return true;
    } catch {
        // Parent doesn't exist, recursively check its parent
        return validateParentDirectories(parentDir);
    }
}

/**
 * Checks if a path is within any of the allowed directories
 * 
 * @param pathToCheck Path to check
 * @returns boolean True if path is allowed
 */
async function isPathAllowed(pathToCheck: string): Promise<boolean> {
    // If root directory is allowed, all paths are allowed
    const allowedDirectories = await getAllowedDirs();
    if (allowedDirectories.includes('/') || allowedDirectories.length === 0) {
        return true;
    }

    let normalizedPathToCheck = normalizePath(pathToCheck);
    if(normalizedPathToCheck.slice(-1) === path.sep) {
        normalizedPathToCheck = normalizedPathToCheck.slice(0, -1);
    }

    // Check if the path is within any allowed directory
    const isAllowed = allowedDirectories.some(allowedDir => {
        let normalizedAllowedDir = normalizePath(allowedDir);
        if(normalizedAllowedDir.slice(-1) === path.sep) {
            normalizedAllowedDir = normalizedAllowedDir.slice(0, -1);
        }

        // Check if path is exactly the allowed directory
        if (normalizedPathToCheck === normalizedAllowedDir) {
            return true;
        }
        
        // Check if path is a subdirectory of the allowed directory
        // Make sure to add a separator to prevent partial directory name matches
        // e.g. /home/user vs /home/username
        const subdirCheck = normalizedPathToCheck.startsWith(normalizedAllowedDir + path.sep);
        if (subdirCheck) {
            return true;
        }
        
        // If allowed directory is the root (C:\ on Windows), allow access to the entire drive
        if (normalizedAllowedDir === 'c:' && process.platform === 'win32') {
            return normalizedPathToCheck.startsWith('c:');
        }

        return false;
    });

    return isAllowed;
}

/**
 * Validates a path to ensure it can be accessed or created.
 * For existing paths, returns the real path (resolving symlinks).
 * For non-existent paths, validates parent directories to ensure they exist.
 * 
 * @param requestedPath The path to validate
 * @returns Promise<string> The validated path
 * @throws Error if the path or its parent directories don't exist or if the path is not allowed
 */
export async function validatePath(requestedPath: string): Promise<string> {
    const PATH_VALIDATION_TIMEOUT = 10000; // 10 seconds timeout
    
    const validationOperation = async (): Promise<string> => {
        // Expand home directory if present
        const expandedPath = expandHome(requestedPath);
        
        // Convert to absolute path
        const absolute = path.isAbsolute(expandedPath)
            ? path.resolve(expandedPath)
            : path.resolve(process.cwd(), expandedPath);
            
        // Check if path is allowed
        if (!(await isPathAllowed(absolute))) {
            throw(`Path not allowed: ${requestedPath}. Must be within one of these directories: ${(await getAllowedDirs()).join(', ')}`);
        }
        
        // Check if path exists
        try {
            await fs.stat(absolute);
            // If path exists, resolve any symlinks
            return await fs.realpath(absolute);
        } catch (error) {
            // Path doesn't exist - validate parent directories
            if (await validateParentDirectories(absolute)) {
                // Return the path if a valid parent exists
                // This will be used for folder creation and many other file operations
                return absolute;
            }
            // If no valid parent found, return the absolute path anyway
            return absolute;
        }
    };
    
    // Execute with timeout
    const result = await withTimeout(
        validationOperation(),
        PATH_VALIDATION_TIMEOUT,
        `Path validation for ${requestedPath}`,
        null
    );
    
    if (result === null) {
        // Return a path with an error indicator instead of throwing
        throw new Error(`Path validation failed for path: ${requestedPath}`);
    }
    
    return result;
}

// File operation tools
export interface FileResult {
    content: string;
    mimeType: string;
    isImage: boolean;
}


/**
 * Read file content from the local filesystem
 * @param filePath Path to the file
 * @param offset Optional line offset to start reading from
 * @param limit Optional maximum number of lines to read
 * @returns File content or file result with metadata
 */
export async function readFileFromDisk(filePath: string, offset?: number, limit?: number): Promise<FileResult> {
    // Import the MIME type utilities
    const { getMimeType, isImageFile } = await import('./mime-types.js');

    const validPath = await validatePath(filePath);
    
    // Get config to determine file read line limit
    const config = await configManager.getConfig();
    const DEFAULT_LINE_LIMIT = config.fileReadLineLimit || 1000; // Default to 1000 lines if not configured
    
    // Set the effective line limit (use provided limit or default)
    const effectiveLimit = limit !== undefined ? limit : DEFAULT_LINE_LIMIT;
    const effectiveOffset = offset || 0;
    
    // Detect the MIME type based on file extension
    const mimeType = getMimeType(validPath);
    const isImage = isImageFile(mimeType);
    
    const FILE_READ_TIMEOUT = 30000; // 30 seconds timeout for file operations
    
    // Use withTimeout to handle potential hangs
    const readOperation = async () => {
        if (isImage) {
            // For image files, read as Buffer and convert to base64
            const buffer = await fs.readFile(validPath);
            const content = buffer.toString('base64');
            
            return { content, mimeType, isImage };
        } else {
            // For all other files, try to read as UTF-8 text
            try {
                // Use a streaming approach for reading files line by line
                const { createReadStream } = await import('fs');
                const readline = await import('readline');
                
                // Check if the file exists and get basic stats
                const stats = await fs.stat(validPath);
                // Get binary file size limit from config (default to 10MB if not set)
                const binaryFileSizeLimit = config.binaryFileSizeLimit || 10 * 1024 * 1024;
                
                // If file is binary and large, apply size limit
                if (stats.size > binaryFileSizeLimit && !mimeType.startsWith('text/')) {
                    return { 
                        content: `Binary file too large (${(stats.size / 1024 / 1024).toFixed(2)} MB). Maximum size for binary files is ${(binaryFileSizeLimit / 1024 / 1024).toFixed(0)} MB.`, 
                        mimeType: 'text/plain', 
                        isImage: false 
                    };
                }
                
                // Create readline interface for streaming file line by line
                const fileStream = createReadStream(validPath, { encoding: 'utf8' });
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity
                });
                
                let lineCount = 0; // Total lines in file
                const lines: string[] = []; // Collected lines
                
                // Process each line
                for await (const line of rl) {
                    lineCount++;
                    
                    // Only collect lines within our range
                    if (lineCount > effectiveOffset && lines.length < effectiveLimit) {
                        lines.push(line);
                    }
                    
                    // Get max line count limit from config (default to 1,000,000 if not set)
                    const maxLineCountLimit = config.maxLineCountLimit || 1000000;
                    
                    // Stop counting if we've reached the configured upper limit
                    if (lineCount > maxLineCountLimit) {
                        // Set lineCount to the max limit to indicate it's a very large file
                        lineCount = maxLineCountLimit;
                        break;
                    }
                }
                
                // Format content with line info
                let content = lines.join('\n');
                
                // Add a notice if we're not showing the full file
                if (effectiveOffset > 0 || lines.length === effectiveLimit) {
                    const startLine = effectiveOffset + 1;
                    const endLine = effectiveOffset + lines.length;
                    
                    // Get max line count limit from config (default to 1,000,000 if not set)
                    const maxLineCountLimit = config.maxLineCountLimit || 1000000;
                    content = `[Showing lines ${startLine} to ${endLine} of ${lineCount}${lineCount === maxLineCountLimit ? '+' : ''} total lines]\n\n${content}`;
                }
                
                return { content, mimeType, isImage };
            } catch (error) {
                // If UTF-8 reading fails, treat as binary and return base64 but still as text
                const buffer = await fs.readFile(validPath);
                // Get binary file size limit from config
                const binaryFileSizeLimit = config.binaryFileSizeLimit || 10 * 1024 * 1024; // Default to 10MB
                
                // Apply size limit for binary files
                if (buffer.length > binaryFileSizeLimit) {
                    return { 
                        content: `Binary file too large (${(buffer.length / 1024 / 1024).toFixed(2)} MB). Maximum size for binary files is ${(binaryFileSizeLimit / 1024 / 1024).toFixed(0)} MB.`, 
                        mimeType: 'text/plain', 
                        isImage: false 
                    };
                }
                
                const content = `Binary file content (base64 encoded):\n${buffer.toString('base64')}`;
                return { content, mimeType: 'text/plain', isImage: false };
            }
        }
    };
    // Execute with timeout
    const result = await withTimeout(
        readOperation(),
        FILE_READ_TIMEOUT,
        `Read file operation for ${filePath}`,
        null
    );
    if (result == null) {
        // Handles the impossible case where withTimeout resolves to null instead of throwing
        throw new Error('Failed to read the file');
    }
    
    return result;
}

/**
 * Read a file from the local filesystem
 * @param filePath Path to the file
 * @param offset Optional line offset to start reading from
 * @param limit Optional maximum number of lines to read
 * @returns File content or file result with metadata
 */
export async function readFile(filePath: string, offset?: number, limit?: number): Promise<FileResult> {
    return readFileFromDisk(filePath, offset, limit);
}


export interface MultiFileResult {
    path: string;
    content?: string;
    mimeType?: string;
    isImage?: boolean;
    error?: string;
}

export async function readMultipleFiles(paths: string[]): Promise<MultiFileResult[]> {
    return Promise.all(
        paths.map(async (filePath: string) => {
            try {
                const validPath = await validatePath(filePath);
                const fileResult = await readFile(validPath);

                return {
                    path: filePath,
                    content: typeof fileResult === 'string' ? fileResult : fileResult.content,
                    mimeType: typeof fileResult === 'string' ? "text/plain" : fileResult.mimeType,
                    isImage: typeof fileResult === 'string' ? false : fileResult.isImage
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    path: filePath,
                    error: errorMessage
                };
            }
        }),
    );
}


export async function listDirectory(dirPath: string): Promise<string[]> {
    const validPath = await validatePath(dirPath);
    const entries = await fs.readdir(validPath, { withFileTypes: true });
    return entries.map((entry) => `${entry.isDirectory() ? "[DIR]" : "[FILE]"} ${entry.name}`);
}



export async function getFileInfo(filePath: string): Promise<Record<string, any>> {
    const validPath = await validatePath(filePath);
    const stats = await fs.stat(validPath);
    
    return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        permissions: stats.mode.toString(8).slice(-3),
    };
}

// This function has been replaced with configManager.getConfig()
// Use get_config tool to retrieve allowedDirectories