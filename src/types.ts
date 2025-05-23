import { ChildProcess } from 'child_process';

export interface ProcessInfo {
  pid: number;
  command: string;
  cpu: string;
  memory: string;
}

export interface TerminalSession {
  pid: number;
  process: ChildProcess;
  lastOutput: string;
  isBlocked: boolean;
  startTime: Date;
}

export interface CommandExecutionResult {
  pid: number;
  output: string;
  isBlocked: boolean;
}

export interface ActiveSession {
  pid: number;
  isBlocked: boolean;
  runtime: number;
}

export interface CompletedSession {
  pid: number;
  output: string;
  exitCode: number | null;
  startTime: Date;
  endTime: Date;
}

// Define the server response types
export interface ServerResponseContent {
  type: string;
  text?: string;
  data?: string;
  mimeType?: string;
}

export interface ServerResult {
  content: ServerResponseContent[];
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

// Define a helper type for tool handler functions
export type ToolHandler<T = unknown> = (args: T) => Promise<ServerResult>;

// Entry info for find tool results
export interface EntryInfo {
  path: string;
  type: 'file' | 'directory';
  size?: number;
  created?: string;
  modified?: string;
  accessed?: string;
  permissions?: string;
  mime_type?: string;
  preview?: string;
}

// Write tool result item
export interface WriteResultItem {
  operation: string;
  path: string;
  success: boolean;
  error?: string;
  details?: Record<string, unknown>;
}
