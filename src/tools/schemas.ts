import { z } from "zod";

console.error("Loading schemas.ts");

// Config tools schemas
export const GetConfigArgsSchema = z.object({});

export const SetConfigValueArgsSchema = z.object({
  key: z.string(),
  value: z.any(),
});

// Empty schemas
export const ListProcessesArgsSchema = z.object({});

// Terminal tools schemas
export const ExecuteCommandArgsSchema = z.object({
  command: z.string(),
  timeout_ms: z.number().optional(),
  shell: z.string().optional(),
});

export const ReadOutputArgsSchema = z.object({
  pid: z.number(),
});

export const ForceTerminateArgsSchema = z.object({
  pid: z.number(),
});

export const ListSessionsArgsSchema = z.object({});

export const KillProcessArgsSchema = z.object({
  pid: z.number(),
});

// Filesystem tools schemas
export const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
});

export const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const MoveFileArgsSchema = z.object({
  source: z.string(),
  destination: z.string(),
});

export const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

// Edit tools schemas
export const EditBlockArgsSchema = z.object({
  blockContent: z.string(),
});