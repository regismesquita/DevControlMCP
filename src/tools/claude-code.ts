import { spawn } from 'child_process';
import { ServerResult } from '../types.js';
import { configManager } from '../config-manager.js';
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
 * Spawns a child process and captures its stdout/stderr.
 */
async function spawnClaudeCliProcess(command: string, args: string[], options?: { timeout?: number, cwd?: string }): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    debugLog(`Executing Claude CLI: ${command} ${args.join(' ')}`);
    const childProcess = spawn(command, args, {
      shell: false, // Always use `shell: false` for direct binary execution
      timeout: options?.timeout,
      cwd: options?.cwd,
      stdio: ['ignore', 'pipe', 'pipe'] // Ignore stdin, pipe stdout/stderr
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';

    childProcess.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      debugLog(`Stdout chunk: ${data.toString().trim()}`);
    });

    childProcess.stderr.on('data', (data) => {
      stderrBuffer += data.toString();
      debugLog(`Stderr chunk: ${data.toString().trim()}`);
    });

    childProcess.on('close', (code) => {
      debugLog(`Claude CLI process exited with code: ${code}`);
      if (code === 0) {
        resolve({ stdout: stdoutBuffer, stderr: stderrBuffer });
      } else {
        let errorMessage = `Claude CLI process failed with exit code ${code}.`;
        if (stderrBuffer) {
          errorMessage += `\nStderr: ${stderrBuffer.trim()}`;
        }
        if (stdoutBuffer) {
          errorMessage += `\nStdout: ${stdoutBuffer.trim()}`;
        }
        reject(new Error(errorMessage));
      }
    });

    childProcess.on('error', (err: NodeJS.ErrnoException) => {
      debugLog(`Error spawning Claude CLI process: ${err.message}`);
      let errorMessage = `Failed to execute Claude CLI: ${err.message}`;
      if (err.code === 'ENOENT') {
        errorMessage += `\n\nPossible cause: Claude CLI executable not found. Ensure it's installed and accessible via PATH, or configure 'claudeCliPath'/'claudeCliName' in DevControlMCP's config.json.`;
      }
      reject(new Error(errorMessage));
    });
  });
}

/**
 * Calls the Claude Code CLI with the given prompt and options.
 */
export async function callClaudeCode(prompt: string, workFolder?: string, tools?: string[]): Promise<ServerResult> {
  try {
    const claudeCliExecutable = await findClaudeCliExecutable();
    const cliArgs: string[] = ['--dangerously-skip-permissions', '-p', prompt];

    if (tools && tools.length > 0) {
      cliArgs.push('--tools', tools.join(','));
    }

    // Determine effective working directory
    let effectiveCwd = os.homedir(); // Default to home directory
    if (workFolder) {
      const resolvedWorkFolder = path.resolve(workFolder);
      if (existsSync(resolvedWorkFolder)) {
        effectiveCwd = resolvedWorkFolder;
        debugLog(`Using specified workFolder: ${effectiveCwd}`);
      } else {
        console.warn(`[Warning] Specified workFolder "${workFolder}" does not exist. Using default: ${effectiveCwd}`);
      }
    } else {
      debugLog(`No workFolder specified, using default: ${effectiveCwd}`);
    }

    // Set a reasonable timeout for Claude Code operations (e.g., 5 minutes)
    const CLAUDE_CODE_TIMEOUT_MS = 300000; // 5 minutes

    const { stdout, stderr } = await spawnClaudeCliProcess(
      claudeCliExecutable,
      cliArgs,
      { timeout: CLAUDE_CODE_TIMEOUT_MS, cwd: effectiveCwd }
    );

    // Check for specific permission acceptance message in stderr
    if (stderr.includes("--dangerously-skip-permissions") && stderr.includes("accept")) {
      return createErrorResponse(
        `Claude Code CLI requires one-time permission acceptance. Please run ` +
        `"${claudeCliExecutable} --dangerously-skip-permissions" in your terminal, ` +
        `follow the prompts, and then restart DevControlMCP.`
      );
    }

    // Return stdout as the primary content
    return {
      content: [{ type: "text", text: stdout }],
    };

  } catch (error: any) {
    debugLog(`Error in callClaudeCode: ${error.message}`);
    let errorMessage = error.message;
    // Append stderr/stdout from the error if available (from spawnClaudeCliProcess)
    if (error.stderr) {
      errorMessage += `\nStderr: ${error.stderr}`;
    }
    if (error.stdout) {
      errorMessage += `\nStdout: ${error.stdout}`;
    }
    return createErrorResponse(`Claude Code execution error: ${errorMessage}`);
  }
}
