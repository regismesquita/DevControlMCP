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
export const ReadFileArgsSchema = z.object({
  path: z.string(),
  offset: z.number().optional(), // Line number offset to start reading from
  limit: z.number().optional(),  // Maximum number of lines to read
});

export const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
});

export const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

export const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

// Search tools schema
export const SearchCodeArgsSchema = z.object({
  path: z.string(),
  pattern: z.string(),
  filePattern: z.string().optional(),
  ignoreCase: z.boolean().optional(),
  maxResults: z.number().optional(),
  includeHidden: z.boolean().optional(),
  contextLines: z.number().optional(),
  timeoutMs: z.number().optional(),
});

// Edit tools schemas
export const EditBlockArgsSchema = z.object({
  blockContent: z.string(),
});

// Claude Code tool schema
export const ClaudeCodeArgsSchema = z.object({
  prompt: z.string(),
  workFolder: z.string().optional(),
  tools: z.array(z.string()).optional(),
});

// Web fetching tool schema
export const FetchUrlArgsSchema = z.object({
  url: z.string().url(),
  format: z.enum(['text', 'markdown', 'image']).optional().default('markdown'),
  offset: z.number().optional(), // Character offset for partial content
  length: z.number().optional(), // Maximum number of characters to fetch
  timeoutMs: z.number().optional().default(30000),
});

// Find tool schema
export const FindArgsSchema = z.object({
  base_path: z.string(),
  name_pattern: z.string().optional(),
  content_pattern: z.string().optional(),
  metadata_filter: z.object({
    size_min: z.number().optional(),
    size_max: z.number().optional(),
    created_after: z.string().optional(),
    created_before: z.string().optional(),
    modified_after: z.string().optional(),
    modified_before: z.string().optional(),
    entry_type: z.enum(['file', 'directory']).optional(),
    mime_type: z.string().optional(),
  }).optional(),
  offset: z.number().optional().default(0),
  limit: z.number().optional().default(100),
});

// Write tool schema
const WriteOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('put'),
    path: z.string(),
    content: z.string(),
    encoding: z.enum(['utf-8', 'base64']).optional().default('utf-8'),
    mode: z.enum(['overwrite', 'append']).optional().default('overwrite'),
  }),
  z.object({
    type: z.literal('mkdir'),
    path: z.string(),
    recursive: z.boolean().optional().default(false),
  }),
  z.object({
    type: z.literal('copy'),
    source: z.string(),
    destination: z.string(),
    overwrite: z.boolean().optional().default(false),
  }),
  z.object({
    type: z.literal('move'),
    source: z.string(),
    destination: z.string(),
    overwrite: z.boolean().optional().default(false),
  }),
  z.object({
    type: z.literal('delete'),
    path: z.string(),
    recursive: z.boolean().optional().default(false),
  }),
  z.object({
    type: z.literal('touch'),
    path: z.string(),
  }),
]);

export const WriteArgsSchema = z.object({
  operations: z.array(WriteOperationSchema),
});
