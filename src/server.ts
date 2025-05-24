import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    ListResourcesRequestSchema,
    ListPromptsRequestSchema,
    type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import {zodToJsonSchema} from "zod-to-json-schema";
import {
    ExecuteCommandArgsSchema,
    ReadOutputArgsSchema,
    ForceTerminateArgsSchema,
    ListSessionsArgsSchema,
    KillProcessArgsSchema,
    ReadFileArgsSchema,
    ReadMultipleFilesArgsSchema,
    ListDirectoryArgsSchema,
    GetFileInfoArgsSchema,
    EditBlockArgsSchema,
    SearchCodeArgsSchema,
    GetConfigArgsSchema,
    SetConfigValueArgsSchema,
    ListProcessesArgsSchema,
    ClaudeCodeArgsSchema,
    FetchUrlArgsSchema,
    FindArgsSchema,
    WriteArgsSchema,
} from './tools/schemas.js';
import {getConfig, setConfigValue} from './tools/config.js';

import {VERSION} from './version.js';
import {trackToolCall} from "./utils/trackTools.js";

/**
 * Helper function to get tool description from environment variables or fall back to default.
 * This function supports customizing tool descriptions through environment variables without
 * modifying the codebase. Environment variables follow the naming convention:
 * 
 * MCP_DESC_<TOOLNAME> where <TOOLNAME> is the uppercase name of the tool
 * 
 * Example: For a tool named 'browser_preview', the env var would be 'MCP_DESC_BROWSER_PREVIEW'
 * 
 * @param toolName - The name of the tool (used to construct the environment variable name)
 * @param defaultDescription - The default description to use if no valid override is found
 * @returns The tool description to use (either custom from env var or the default)
 */
function getToolDescription(toolName: string, defaultDescription: string): string {
    const envVarName = `MCP_DESC_${toolName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    const customDescription = process.env[envVarName];
    
    // Maximum allowed description length (too long descriptions can cause UI issues)
    const MAX_DESCRIPTION_LENGTH = 1000;
    
    // Use custom description if it exists and isn't just whitespace
    if (customDescription !== undefined && customDescription.trim() !== '') {
        // Validate description length
        if (customDescription.length > MAX_DESCRIPTION_LENGTH) {
            console.warn(`Tool description for ${toolName} exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters. Description will be truncated.`);
            return customDescription.substring(0, MAX_DESCRIPTION_LENGTH) + '... (truncated)';
        }
        return customDescription;
    } else {
        return defaultDescription;
    }
}

console.error("Loading server.ts");

export const server = new Server(
    {
        name: "DevControlMCP",
        version: VERSION,
    },
    {
        capabilities: {
            tools: {},
            resources: {},  // Add empty resources capability
            prompts: {},    // Add empty prompts capability
        },
    },
);

// Add handler for resources/list method
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Return an empty list of resources
    return {
        resources: [],
    };
});

// Add handler for prompts/list method
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    // Return an empty list of prompts
    return {
        prompts: [],
    };
});

console.error("Setting up request handlers...");

server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
        console.error("Generating tools list...");
        return {
            tools: [
                // Configuration tools
                {
                    name: "get_config",
                    description: getToolDescription(
                        "get_config",
                        "Get the complete server configuration as JSON. Config includes fields for: blockedCommands (array of blocked shell commands), defaultShell (shell to use for commands), allowedDirectories (paths the server can access)."
                    ),
                    inputSchema: zodToJsonSchema(GetConfigArgsSchema),
                },
                {
                    name: "set_config_value",
                    description: getToolDescription(
                        "set_config_value",
                        "Set a specific configuration value by key. WARNING: Should be used in a separate chat from file operations and command execution to prevent security issues. Config keys include: blockedCommands (array), defaultShell (string), allowedDirectories (array of paths). IMPORTANT: Setting allowedDirectories to an empty array ([]) allows full access to the entire file system, regardless of the operating system."
                    ),
                    inputSchema: zodToJsonSchema(SetConfigValueArgsSchema),
                },

                // Terminal tools
                {
                    name: "execute_command",
                    description: getToolDescription(
                        "execute_command",
                        "Execute a terminal command with timeout. Command will continue running in background if it doesn't complete within timeout."
                    ),
                    inputSchema: zodToJsonSchema(ExecuteCommandArgsSchema),
                },
                {
                    name: "read_output",
                    description: getToolDescription(
                        "read_output",
                        "Read new output from a running terminal session."
                    ),
                    inputSchema: zodToJsonSchema(ReadOutputArgsSchema),
                },
                {
                    name: "force_terminate",
                    description: getToolDescription(
                        "force_terminate",
                        "Force terminate a running terminal session."
                    ),
                    inputSchema: zodToJsonSchema(ForceTerminateArgsSchema),
                },
                {
                    name: "list_sessions",
                    description: getToolDescription(
                        "list_sessions",
                        "List all active terminal sessions."
                    ),
                    inputSchema: zodToJsonSchema(ListSessionsArgsSchema),
                },
                {
                    name: "list_processes",
                    description: getToolDescription(
                        "list_processes",
                        "List all running processes. Returns process information including PID, command name, CPU usage, and memory usage."
                    ),
                    inputSchema: zodToJsonSchema(ListProcessesArgsSchema),
                },
                {
                    name: "kill_process",
                    description: getToolDescription(
                        "kill_process",
                        "Terminate a running process by PID. Use with caution as this will forcefully terminate the specified process."
                    ),
                    inputSchema: zodToJsonSchema(KillProcessArgsSchema),
                },

                // Filesystem tools
                {
                    name: "read_file",
                    description: getToolDescription(
                        "read_file",
                        "Read the complete contents of a file from the file system. Only works within allowed directories. Handles text files normally and image files are returned as viewable images. Recognized image types: PNG, JPEG, GIF, WebP."
                    ),
                    inputSchema: zodToJsonSchema(ReadFileArgsSchema),
                },
                {
                    name: "read_multiple_files",
                    description: getToolDescription(
                        "read_multiple_files",
                        "Read the contents of multiple files simultaneously. Each file's content is returned with its path as a reference. Handles text files normally and renders images as viewable content. Recognized image types: PNG, JPEG, GIF, WebP. Failed reads for individual files won't stop the entire operation. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(ReadMultipleFilesArgsSchema),
                },
                {
                    name: "list_directory",
                    description: getToolDescription(
                        "list_directory",
                        "Get a detailed listing of all files and directories in a specified path. Results distinguish between files and directories with [FILE] and [DIR] prefixes. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(ListDirectoryArgsSchema),
                },
                {
                    name: "search_code",
                    description: getToolDescription(
                        "search_code",
                        "Search for text/code patterns within file contents using ripgrep. Fast and powerful search similar to VS Code search functionality. Supports regular expressions, file pattern filtering, and context lines. Has a default timeout of 30 seconds which can be customized. Only searches within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(SearchCodeArgsSchema),
                },
                {
                    name: "get_file_info",
                    description: getToolDescription(
                        "get_file_info",
                        "Retrieve detailed metadata about a file or directory including size, creation time, last modified time, permissions, and type. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(GetFileInfoArgsSchema),
                },
                // Note: list_allowed_directories removed - use get_config to check allowedDirectories

                // Text editing tools
                {
                    name: "edit_block",
                    description: getToolDescription(
                        "edit_block",
                        "Apply surgical text replacements to files. Best for small changes (<20% of file size). Call repeatedly to change multiple blocks. Will verify changes after application. Format:\nfilepath\n<<<<<<< SEARCH\ncontent to find\n=======\nnew content\n>>>>>>> REPLACE"
                    ),
                    inputSchema: zodToJsonSchema(EditBlockArgsSchema),
                },

                // Claude Code meta-tool
                {
                    name: "claude_code",
                    description:
                        "Executes a prompt directly using the Claude Code CLI with permissions bypassed. This tool provides access to Claude Code's full capabilities including file operations, Git, terminal commands, and web search. Use 'workFolder' for contextual execution and 'tools' to specify which Claude tools to enable (e.g., ['Bash', 'Read', 'Write']). Requires Claude CLI to be installed and permissions accepted manually once with 'claude --dangerously-skip-permissions'. WARNING: This tool bypasses DevControlMCP's internal permission system as it delegates to an external CLI process.",
                    inputSchema: zodToJsonSchema(ClaudeCodeArgsSchema),
                },

                // Web and enhanced tools
                {
                    name: "fetch_url",
                    description: getToolDescription(
                        "fetch_url",
                        "Fetch content from a URL. Supports HTML to Markdown conversion (best for articles/blogs), image compression, and partial content fetching. Limits: 10MB max download, 1MB image compression threshold, 30s default timeout. Returns content as text, markdown, or base64-encoded images. Has Readability fallback for content extraction."
                    ),
                    inputSchema: zodToJsonSchema(FetchUrlArgsSchema),
                },
                {
                    name: "find",
                    description: getToolDescription(
                        "find",
                        "Advanced file search with support for name patterns (glob), content patterns (text/regex), and metadata filters (size, dates, type, MIME type). Combines criteria with AND logic. Limits: 1000 max results, depth 10. Note: For high-performance code search, prefer search_code which uses ripgrep. Only searches within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(FindArgsSchema),
                },
                {
                    name: "write",
                    description: getToolDescription(
                        "write",
                        "Batch write operations supporting multiple file operations in a single call. Operations: put (write file), mkdir (create directory), copy, move, delete, touch. Each operation succeeds/fails independently with detailed per-operation feedback, allowing partial success. Only works within allowed directories."
                    ),
                    inputSchema: zodToJsonSchema(WriteArgsSchema),
                },
            ],
        };
    } catch (error) {
        console.error("Error in list_tools request handler:", error);
        throw error;
    }
});

import * as handlers from './handlers/index.js';
import {ServerResult} from './types.js';

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<ServerResult> => {
    try {
        const {name, arguments: args} = request.params;
        // Log tool call for auditing
        await trackToolCall(name, args);

        // Using a more structured approach with dedicated handlers
        switch (name) {
            // Config tools
            case "get_config":
                try {
                    return await getConfig();
                } catch (error) {
                    console.error(`Error in get_config handler: ${error}`);
                    return {
                        content: [{type: "text", text: `Error: Failed to get configuration`}],
                        isError: true,
                    };
                }
            case "set_config_value":
                try {
                    return await setConfigValue(args);
                } catch (error) {
                    console.error(`Error in set_config_value handler: ${error}`);
                    return {
                        content: [{type: "text", text: `Error: Failed to set configuration value`}],
                        isError: true,
                    };
                }

            // Terminal tools
            case "execute_command":
                return await handlers.handleExecuteCommand(args);

            case "read_output":
                return await handlers.handleReadOutput(args);

            case "force_terminate":
                return await handlers.handleForceTerminate(args);

            case "list_sessions":
                return await handlers.handleListSessions();

            // Process tools
            case "list_processes":
                return await handlers.handleListProcesses();

            case "kill_process":
                return await handlers.handleKillProcess(args);

            // Filesystem tools
            case "read_file":
                return await handlers.handleReadFile(args);

            case "read_multiple_files":
                return await handlers.handleReadMultipleFiles(args);

            case "list_directory":
                return await handlers.handleListDirectory(args);

            case "search_code":
                return await handlers.handleSearchCode(args);

            case "get_file_info":
                return await handlers.handleGetFileInfo(args);

            case "edit_block":
                return await handlers.handleEditBlock(args);

            case "claude_code":
                return await handlers.handleClaudeCode(args);

            // New enhanced tools
            case "fetch_url":
                return await handlers.handleFetchUrl(args);
                
            case "find":
                return await handlers.handleFind(args);
                
            case "write":
                return await handlers.handleWrite(args);

            default:
                // Telemetry removed
                return {
                    content: [{type: "text", text: `Error: Unknown tool: ${name}`}],
                    isError: true,
                };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Telemetry removed
        return {
            content: [{type: "text", text: `Error: ${errorMessage}`}],
            isError: true,
        };
    }
});