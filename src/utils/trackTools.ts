import * as fs from 'fs';
import * as path from 'path';
import { TOOL_CALL_FILE, TOOL_CALL_FILE_MAX_SIZE, LOG_RETENTION_COUNT } from '../config.js';

// Ensure the directory for the log file exists
const logDir = path.dirname(TOOL_CALL_FILE);
await fs.promises.mkdir(logDir, { recursive: true });

/**
 * Clean up old log files, keeping only the most recent ones based on LOG_RETENTION_COUNT
 * @param dirName Directory containing log files
 * @param fileBase Base name of the log file
 * @param fileExt Extension of the log file
 */
async function cleanupOldLogFiles(dirName: string, fileBase: string, fileExt: string): Promise<void> {
  try {
    // Read all files in the directory
    const files = await fs.promises.readdir(dirName);
    
    // Filter rotated log files matching the pattern fileBase_timestamp.fileExt
    const logPattern = new RegExp(`^${fileBase}_.*${fileExt}$`);
    const rotatedLogFiles = files
      .filter(file => logPattern.test(file))
      .map(file => ({
        name: file,
        path: path.join(dirName, file),
        created: 0
      }));
    
    // If we have more files than the retention limit, get stats and sort by creation time
    if (rotatedLogFiles.length > LOG_RETENTION_COUNT) {
      // Get stats for all files to sort by creation time
      for (const logFile of rotatedLogFiles) {
        try {
          const stats = await fs.promises.stat(logFile.path);
          logFile.created = stats.ctimeMs; // Creation time in milliseconds
        } catch (error) {
          // If we can't get stats, use 0 (oldest possible time)
        }
      }
      
      // Sort by creation time (newest first)
      rotatedLogFiles.sort((a, b) => b.created - a.created);
      
      // Delete oldest files beyond our retention limit
      for (let i = LOG_RETENTION_COUNT; i < rotatedLogFiles.length; i++) {
        try {
          await fs.promises.unlink(rotatedLogFiles[i].path);
        } catch (error) {
          console.error(`Error deleting old log file ${rotatedLogFiles[i].path}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error cleaning up log files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Track tool calls and save them to a log file
 * @param toolName Name of the tool being called
 * @param args Arguments passed to the tool (optional)
 */
export async function trackToolCall(toolName: string, args?: unknown): Promise<void> {
  try {
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Format the log entry
    const logEntry = `${timestamp} | ${toolName.padEnd(20, ' ')}${args ? `\t| Arguments: ${JSON.stringify(args)}` : ''}\n`;

    // Check if file exists and get its size
    let fileSize = 0;
    
    try {
      const stats = await fs.promises.stat(TOOL_CALL_FILE);
      fileSize = stats.size;
    } catch (err) {
      // File doesn't exist yet, size remains 0
    }
    
    // If file size is 10MB or larger, rotate the log file
    if (fileSize >= TOOL_CALL_FILE_MAX_SIZE) {
      const fileExt = path.extname(TOOL_CALL_FILE);
      const fileBase = path.basename(TOOL_CALL_FILE, fileExt);
      const dirName = path.dirname(TOOL_CALL_FILE);
      
      // Create a timestamp-based filename for the old log
      const date = new Date();
      const rotateTimestamp = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}_${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}-${String(date.getSeconds()).padStart(2, '0')}`;
      const newFileName = path.join(dirName, `${fileBase}_${rotateTimestamp}${fileExt}`);
      
      // Rename the current file
      await fs.promises.rename(TOOL_CALL_FILE, newFileName);
      
      // Clean up old rotated log files to prevent unbounded disk usage
      await cleanupOldLogFiles(dirName, fileBase, fileExt);
    }
    
    // Append to log file (if file was renamed, this will create a new file)
    await fs.promises.appendFile(TOOL_CALL_FILE, logEntry, 'utf8');
    
  } catch (error) {
    // Don't let logging errors affect the main functionality
    console.error(`Error logging tool call: ${error instanceof Error ? error.message : String(error)}`);
  }
}