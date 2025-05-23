import { ServerResult } from '../types.js';
import { configManager } from '../config-manager.js';
import { terminalManager } from '../terminal-manager.js';
import { escapeShellArg, buildShellCommand } from '../utils/shell-escape.js';
import path from 'path';
import os from 'os';
import { existsSync } from 'fs';
import { createErrorResponse } from '../error-handlers.js';

// Global constant for debug mode (can be set via env var)
const debugMode = process.env.MCP_CLAUDE_DEBUG === 'true';

function debugLog(message?: any, ...optionalParams: any[]): void {
  if (debugMode) {
    console.error(`[ClaudeCodeTool Debug] ${message}`, ...optionalParams);
  }
}

/**
 * Determines the path to the Claude CLI executable.
 * Prioritizes:
 * 1. `claudeCliPath` from DevControlMCP config (absolute path).
 * 2. Default local installation path (~/.claude/local/claude).
 * 3. Falls back to `claudeCliName` from DevControlMCP config (binary name, defaults to 'claude').
 */
async function findClaudeCliExecutable(): Promise<string> {
  debugLog('Attempting to find Claude CLI executable...');
  const config = await configManager.getConfig();
  const configuredCliPath = config.claudeCliPath as string | undefined;
  const configuredCliName = (config.claudeCliName as string) || 'claude';

  // 1. Check configured absolute path
  if (configuredCliPath) {
    if (path.isAbsolute(configuredCliPath)) {
      if (existsSync(configuredCliPath)) {
        debugLog(`Using configured absolute path: ${configuredCliPath}`);
        return configuredCliPath;
      } else {
        console.warn(`[Warning] Configured claudeCliPath "${configuredCliPath}" does not exist. Falling back.`);
      }
    } else {
      // Reject relative paths for claudeCliPath for security and clarity
      throw new Error(`Invalid claudeCliPath: "${configuredCliPath}". Must be an absolute path.`);
    }
  }

  // 2. Check default local installation path
  const defaultLocalPath = path.join(os.homedir(), '.claude', 'local', 'claude');
  if (existsSync(defaultLocalPath)) {
    debugLog(`Found Claude CLI at default local path: ${defaultLocalPath}`);
    return defaultLocalPath;
  } else {
    debugLog(`Claude CLI not found at default local path: ${defaultLocalPath}`);
  }

  // 3. Fallback to configured name or 'claude' (relying on system PATH)
  debugLog(`Falling back to command name "${configuredCliName}", relying on system PATH.`);
  console.warn(`[Warning] Claude CLI not found at ~/.claude/local/claude or configured claudeCliPath. Relying on "${configuredCliName}" being in your system's PATH.`);
  return configuredCliName;
}


/**
 * Calls the Claude Code CLI with the given prompt and options.
 * Now uses TerminalManager for async job management to handle long-running tasks.
 * 
 * @param prompt - The prompt to send to Claude Code
 * @param workFolder - Optional working directory for Claude Code execution
 * @param tools - Optional array of allowed tools for Claude Code to use
 * 
 * @returns ServerResult with either:
 *   - Direct output if task completes within 30 seconds
 *   - PID and instructions for async monitoring if task is still running
 * 
 * @remarks
 * The function uses a 30-second initial timeout to determine if a job should be
 * handled asynchronously. Jobs that exceed this timeout will continue running
 * in the background indefinitely until:
 *   - The process completes naturally
 *   - The user calls force_terminate with the PID
 *   - The MCP server is shut down
 * 
 * There is no maximum lifetime timeout for background jobs - they can run as long
 * as needed. Users can check progress using read_output with the returned PID.
 */
export async function callClaudeCode(prompt: string, workFolder?: string, tools?: string[]): Promise<ServerResult> {
  try {
    const claudeCliExecutable = await findClaudeCliExecutable();
    
    // Build command arguments
    const cliArgs: string[] = ['-p', prompt];
    if (tools && tools.length > 0) {
      cliArgs.push('--allowedTools', ...tools);
    }

    // Determine effective working directory
    let effectiveCwd = os.homedir(); // Default to home directory
    let validWorkFolder: string | undefined;
    
    if (workFolder) {
      const resolvedWorkFolder = path.resolve(workFolder);
      if (existsSync(resolvedWorkFolder)) {
        effectiveCwd = resolvedWorkFolder;
        validWorkFolder = effectiveCwd;
        debugLog(`Using specified workFolder: ${effectiveCwd}`);
      } else {
        console.warn(`[Warning] Specified workFolder "${workFolder}" does not exist. Using default: ${effectiveCwd}`);
      }
    } else {
      debugLog(`No workFolder specified, using default: ${effectiveCwd}`);
    }

    // Build the full command string for TerminalManager using our shell-safe utilities
    const fullCommand = buildShellCommand(
      claudeCliExecutable,
      cliArgs,
      {
        // Only set working directory if we have a valid workFolder that's different from home
        workingDirectory: validWorkFolder
      }
    );

    debugLog(`Executing Claude Code command: ${fullCommand}`);

    // Use shorter initial timeout (30s) to return PID quickly for async operations
    const INITIAL_TIMEOUT_MS = 30000; // 30 seconds
    
    // Execute command using TerminalManager
    const result = await terminalManager.executeCommand(fullCommand, INITIAL_TIMEOUT_MS);

    // Check for error condition (pid = -1)
    if (result.pid === -1) {
      return createErrorResponse(`Failed to start Claude Code process: ${result.output}`);
    }

    // Check for permission errors in initial output
    if (result.output.includes("permission") && result.output.includes("accept")) {
      // Clean up the process if it's still running
      if (result.isBlocked) {
        terminalManager.forceTerminate(result.pid);
      }
      return createErrorResponse(
        `Claude Code CLI requires one-time permission acceptance. Please run ` +
        `"${claudeCliExecutable} --dangerously-skip-permissions" in a separate terminal, ` +
        `follow the prompts to accept permissions, and then try again.`
      );
    }

    // Format response based on whether the process completed or is still running
    if (result.isBlocked) {
      // Process is still running - return PID for async monitoring
      return {
        content: [{
          type: "text",
          text: `Claude Code job started with PID ${result.pid}\n` +
                `Working directory: ${effectiveCwd}\n` +
                `Initial output:\n${result.output}\n\n` +
                `Job is still running. Use read_output with PID ${result.pid} to check status.`
        }],
      };
    } else {
      // Process completed quickly - return full output
      return {
        content: [{ type: "text", text: result.output }],
      };
    }

  } catch (error: any) {
    debugLog(`Error in callClaudeCode: ${error.message}`);
    return createErrorResponse(`Claude Code execution error: ${error.message}`);
  }
}
