/**
 * Advanced file search tool implementation
 * Supports searching by name patterns, content patterns, and metadata filters
 */

import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import micromatch from 'micromatch';
import { FindArgsSchema } from './schemas.js';
import { EntryInfo } from '../types.js';
import { validatePath } from './filesystem.js';
import { getMimeType } from './mime-types.js';

/**
 * Check if a file is text-based for content search
 */
async function isTextBasedFile(filePath: string): Promise<boolean> {
  const ext = path.extname(filePath).toLowerCase();
  const textExtensions = [
    '.txt', '.text', '.log', '.md', '.markdown', '.rst',
    '.js', '.ts', '.jsx', '.tsx', '.json', '.json5',
    '.xml', '.html', '.htm', '.css', '.scss', '.sass', '.less',
    '.py', '.rb', '.java', '.c', '.cpp', '.cc', '.cxx',
    '.h', '.hpp', '.cs', '.go', '.rs', '.php', '.pl',
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
    '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
    '.sql', '.csv', '.tsv', '.dockerfile',
    '.gitignore', '.gitattributes', '.env', '.editorconfig',
    '.eslintrc', '.prettierrc'
  ];

  if (textExtensions.includes(ext)) {
    return true;
  }

  // Check MIME type for files without known extensions
  const mimeType = await getMimeType(filePath);
  if (!mimeType) {
    // If no MIME type and no extension, check if content is text
    if (!ext) {
      try {
        const buffer = await fs.readFile(filePath, { encoding: null });
        const sample = buffer.subarray(0, 1024).toString('utf-8');
        // Check for null bytes and if mostly printable
        return !sample.includes('\0') && /^[\x20-\x7E\s]*$/.test(sample);
      } catch {
        return false;
      }
    }
    return false;
  }

  return (
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('application/x-sh')
  );
}

/**
 * Check if file content matches the pattern
 */
async function matchesContentPattern(
  filePath: string,
  pattern: string,
  options?: { regex?: boolean; caseSensitive?: boolean }
): Promise<boolean> {
  if (!(await isTextBasedFile(filePath))) {
    return false;
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (options?.regex) {
      const flags = options.caseSensitive ? '' : 'i';
      const regex = new RegExp(pattern, flags);
      
      // Handle line anchors
      if (pattern.includes('^') || pattern.includes('$')) {
        const lines = content.split('\n');
        return lines.some(line => regex.test(line));
      }
      return regex.test(content);
    } else {
      // Plain text search
      if (options?.caseSensitive === false) {
        return content.toLowerCase().includes(pattern.toLowerCase());
      }
      return content.includes(pattern);
    }
  } catch {
    return false;
  }
}

/**
 * Check if entry matches metadata filter
 */
function matchesMetadataFilter(
  entryInfo: EntryInfo,
  filter: z.infer<typeof FindArgsSchema>['metadata_filter']
): boolean {
  if (!filter) return true;

  // Check size filters
  if (filter.size_min !== undefined && (entryInfo.size || 0) < filter.size_min) {
    return false;
  }
  if (filter.size_max !== undefined && (entryInfo.size || 0) > filter.size_max) {
    return false;
  }

  // Check created date filters
  if (entryInfo.created) {
    const createdDate = new Date(entryInfo.created).getTime();
    if (filter.created_after && createdDate < new Date(filter.created_after).getTime()) {
      return false;
    }
    if (filter.created_before && createdDate > new Date(filter.created_before).getTime()) {
      return false;
    }
  }

  // Check modified date filters
  if (entryInfo.modified) {
    const modifiedDate = new Date(entryInfo.modified).getTime();
    if (filter.modified_after && modifiedDate < new Date(filter.modified_after).getTime()) {
      return false;
    }
    if (filter.modified_before && modifiedDate > new Date(filter.modified_before).getTime()) {
      return false;
    }
  }

  // Check entry type
  if (filter.entry_type && entryInfo.type !== filter.entry_type) {
    return false;
  }

  // Check MIME type
  if (filter.mime_type && entryInfo.mime_type) {
    const mimeMatches = entryInfo.mime_type.toLowerCase().includes(filter.mime_type.toLowerCase());
    if (!mimeMatches) {
      return false;
    }
  }

  return true;
}

/**
 * Recursively find entries matching criteria
 */
async function findEntriesRecursive(
  currentPath: string,
  args: z.infer<typeof FindArgsSchema>,
  depth: number = 0
): Promise<EntryInfo[]> {
  const results: EntryInfo[] = [];
  const maxDepth = args.limit || 100;
  
  if (depth > 10) { // Reasonable recursion limit
    return results;
  }

  try {
    const entries = await fs.readdir(currentPath);
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);
      
      try {
        // Validate path security
        await validatePath(fullPath);
        
        const stats = await fs.stat(fullPath);
        const entryInfo: EntryInfo = {
          path: fullPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          accessed: stats.atime.toISOString(),
          permissions: stats.mode.toString(8).slice(-3)
        };

        // Add MIME type for files
        if (entryInfo.type === 'file') {
          entryInfo.mime_type = await getMimeType(fullPath);
        }

        // Check all criteria
        let matches = true;

        // Name pattern
        if (args.name_pattern) {
          matches = matches && micromatch.isMatch(entry, args.name_pattern, { dot: true });
        }

        // Content pattern
        if (matches && args.content_pattern && entryInfo.type === 'file') {
          const contentMatches = await matchesContentPattern(
            fullPath,
            args.content_pattern,
            {
              regex: args.content_pattern.includes('[') || args.content_pattern.includes('\\'),
              caseSensitive: true
            }
          );
          matches = matches && contentMatches;
        }

        // Metadata filter
        if (matches && args.metadata_filter) {
          matches = matches && matchesMetadataFilter(entryInfo, args.metadata_filter);
        }

        // Add to results if matches
        if (matches && results.length < maxDepth) {
          results.push(entryInfo);
        }

        // Recurse into directories
        if (stats.isDirectory() && depth < 10) {
          const subResults = await findEntriesRecursive(fullPath, args, depth + 1);
          results.push(...subResults.slice(0, maxDepth - results.length));
        }
      } catch (error) {
        // Skip entries we can't access
        continue;
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return results;
}

/**
 * Find entries matching the specified criteria
 */
export async function findEntries(args: z.infer<typeof FindArgsSchema>): Promise<EntryInfo[]> {
  // Validate and resolve base path
  const basePath = await validatePath(args.base_path);
  
  // Check if path exists and is a directory
  const stats = await fs.stat(basePath);
  if (!stats.isDirectory()) {
    throw new Error(`Base path must be a directory: ${basePath}`);
  }

  // Find entries
  const results = await findEntriesRecursive(basePath, args);
  
  // Apply offset and limit
  const offset = args.offset || 0;
  const limit = args.limit || 100;
  
  return results.slice(offset, offset + limit);
}