**Before we start: This thing can completely destroy your system, files , projects and even worse... so be careful. By default this thing has permission to do whatever it wants on your computer.**

# DevControlMCP

> **IMPORTANT NOTE**: This project is originally based on the [wonderwhy-er/DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP) project. It started as a telemetry-free version and has been transformed into a full fork, the main difference is that it is telemetry free and the license will always be MIT. no new features or anything, actually we will probably be behind the main version and we may strip some features down to keep the bare minimum and avoid tool bloating.  but no telmetry. no license change.

## Overview

DevControlMCP is an MCP (Model Context Protocol) tool that enables Claude desktop app to execute terminal commands and interact with your file system. It turns Claude into a powerful assistant for coding, system management, and file operations.

## Features

- **Terminal Operations**: Execute commands with output streaming, timeouts, and background execution
- **Process Management**: List and manage running processes
- **File Operations**: Read files, list directories, and get metadata
- **Advanced Search**: Powerful file search with glob patterns, content matching, and metadata filters
- **Batch File Operations**: Unified write tool for creating, copying, moving, deleting files and directories
- **Web Content Fetching**: Fetch URLs with HTML to Markdown conversion and image compression
- **Code Editing**: Make surgical text replacements or full file rewrites
- **Code Search**: Search within file contents using ripgrep for high performance
- **Claude Code Integration**: Delegate complex tasks to Claude Code CLI instances via the `claude_code` meta-tool
- **Line-based File Reading**: Read files with line offset and limits for better handling of large files
- **Audit Logging**: Track all tool calls with automatic log rotation
- **Fuzzy Search Logging**: Comprehensive logging and troubleshooting for search operations

## Installation

### Prerequisites
- Node.js v18 or higher
- Claude Desktop app with Pro subscription
- Claude CLI installed globally (for `claude_code` tool) - install with `npm run install:claude-cli`

### Quick Install

### Local Installation
```bash
git clone https://github.com/regismesquita/DevControlMCP.git
cd DevControlMCP
npm run setup
```

### Claude CLI Setup (Optional)

The `claude_code` tool requires the Claude CLI to be installed locally (run it and call `/doctor`) and `-dangerously-skip-permissions` accepted.

```bash
# One-time permission acceptance (required)
claude --dangerously-skip-permissions
# Follow the prompts to accept permissions
```

**Note**: You need to run `claude --dangerously-skip-permissions` once manually to accept permissions. After this one-time setup, the `claude_code` tool will use `claude -p` for MCP server calls without requiring the skip permissions flag.

### Logging Utilities

The following npm scripts are available for working with fuzzy search logs:

```bash
# View recent fuzzy search logs with detailed formatting
npm run logs:view

# View more logs by specifying a count
npm run logs:view -- --count 20

# Analyze logs with statistics and recommendations
npm run logs:analyze

# Export logs to JSON or CSV format
npm run logs:export

# Clear logs (with confirmation prompt)
npm run logs:clear

# Clear logs without prompt
npm run logs:clear -- --force
```

#### Audit Logging

All tool calls are automatically logged to `~/.devcontrol-mcp/tool-calls.log` for auditing purposes. The log file is automatically rotated when it reaches 10MB in size. The system retains the 5 most recent log files and automatically removes older logs to prevent unbounded disk usage.

Tool call logs include:
- Timestamp
- Tool name
- Arguments passed to the tool (when applicable)

## Available Tools

| Category | Tool | Description |
|----------|------|-------------|
| **Configuration** | `get_config` | Get the complete server configuration |
| | `set_config_value` | Set a specific configuration value |
| **Terminal** | `execute_command` | Run a terminal command |
| | `read_output` | Read output from a running session |
| | `force_terminate` | Stop a running terminal session |
| | `list_sessions` | List all active terminal sessions |
| | `list_processes` | List all running processes |
| | `kill_process` | Terminate a process by PID |
| **Filesystem** | `read_file` | Read local files with line offset and limits |
| | `read_multiple_files` | Read multiple files at once |
| | `list_directory` | List files/directories |
| | `get_file_info` | Get file metadata |
| | `write` | Batch file operations (put, mkdir, copy, move, delete, touch) |
| | `find` | Advanced file search with patterns and filters |
| | `search_code` | Search for patterns in file contents using ripgrep |
| **Web** | `fetch_url` | Fetch web content with HTML to Markdown conversion |
| **Text Editing** | `edit_block` | Make surgical text replacements |
| **Meta-Tool** | `claude_code` | Execute prompts via Claude Code CLI with full capabilities |

## Text Editing Example

```
filepath.ext
<<<<<<< SEARCH
content to find
=======
new content
>>>>>>> REPLACE
```

## Claude Code Meta-Tool

The `claude_code` tool allows you to delegate complex tasks directly to Claude Code CLI instances. This is particularly useful for:

- Complex multi-step coding tasks
- Advanced Git operations  
- Terminal command sequences
- Web research and summarization
- Tasks requiring specialized Claude Code capabilities

### Usage

```json
{
  "prompt": "Refactor this function to use async/await",
  "workFolder": "/path/to/project", 
  "tools": ["Bash", "Read", "Write", "Edit"]
}
```

### Parameters

- **`prompt`** (required): Natural language instruction for Claude Code
- **`workFolder`** (optional): Absolute path to working directory
- **`tools`** (optional): Array of Claude tools to enable (e.g., ["Bash", "Read", "Write"])

### Configuration

Configure Claude CLI paths in your DevControlMCP config:

```json
{
  "claudeCliPath": "/custom/path/to/claude",
  "claudeCliName": "claude-custom"
}
```

### Security Note

⚠️ **IMPORTANT**: The `claude_code` tool bypasses DevControlMCP's internal permission system (`allowedDirectories`, `blockedCommands`) because it delegates to an external Claude CLI process. The Claude CLI operates with its own permissions that were accepted during the one-time setup.

## New Enhanced Tools

### Web Content Fetching (`fetch_url`)

Fetch and process web content with intelligent HTML parsing and conversion.

```json
{
  "url": "https://example.com/article",
  "format": "markdown",
  "timeoutMs": 30000
}
```

**Features:**
- HTML to Markdown conversion using Mozilla's Readability
- Image compression for large images
- Support for text, markdown, and base64 formats
- Partial content fetching with offset and length
- 30-second default timeout

### Advanced File Search (`find`)

Powerful file search combining multiple criteria with AND logic.

```json
{
  "base_path": "/path/to/search",
  "recursive": true,
  "match_criteria": [
    {
      "type": "name_pattern",
      "pattern": "*.{js,ts}"
    },
    {
      "type": "content_pattern",
      "pattern": "TODO|FIXME",
      "is_regex": true,
      "case_sensitive": false
    },
    {
      "type": "metadata_filter",
      "attribute": "size_bytes",
      "operator": ">",
      "value": 1000
    }
  ],
  "entry_type_filter": "file",
  "limit": 100,
  "offset": 0
}
```

**Search Criteria:**
- **Name Pattern**: Glob patterns (e.g., `*.js`, `src/**/*.ts`)
- **Content Pattern**: Text or regex search within files
- **Metadata Filters**: Size, creation/modification dates, MIME type

### Batch File Operations (`write`)

Unified tool for all file write operations supporting batched transactions.

```json
{
  "operations": [
    {
      "type": "mkdir",
      "path": "/path/to/new/dir",
      "recursive": true
    },
    {
      "type": "put",
      "path": "/path/to/file.txt",
      "content": "File content",
      "mode": "overwrite",
      "encoding": "text"
    },
    {
      "type": "copy",
      "source": "/path/from",
      "destination": "/path/to",
      "overwrite": true
    },
    {
      "type": "move",
      "source": "/path/from",
      "destination": "/path/to",
      "overwrite": true
    },
    {
      "type": "delete",
      "path": "/path/to/delete",
      "recursive": false
    },
    {
      "type": "touch",
      "path": "/path/to/touch.txt"
    }
  ]
}
```

**Operations:**
- **put**: Write file content (text or base64), supports append mode
- **mkdir**: Create directories with optional recursive creation
- **copy**: Copy files or directories with overwrite control
- **move**: Move/rename files or directories
- **delete**: Remove files or directories (recursive for non-empty dirs)
- **touch**: Create empty file or update timestamps

Each operation succeeds or fails independently, with detailed error reporting.

## Configuration Options

The following configuration options can be set using the `set_config_value` tool:

| Option | Description | Default |
|--------|-------------|---------|
| `allowedDirectories` | Directories that can be accessed (empty array for full access) | `[]` |
| `blockedCommands` | Commands that cannot be executed | Various system commands |
| `defaultShell` | Shell to use for command execution | `bash` (Unix) or `powershell.exe` (Windows) |
| `fileReadLineLimit` | Maximum number of lines to read from a file | `1000` |
| `fileWriteLineLimit` | Maximum number of lines to write to a file | `50` |
| `maxLineCountLimit` | Maximum line count for file reading (prevents memory issues on very large files) | `1000000` |
| `binaryFileSizeLimit` | Maximum size for binary files in bytes | `10485760` (10MB) |
| `claudeCliPath` | Absolute path to Claude CLI executable | `undefined` |
| `claudeCliName` | Name of Claude CLI binary | `'claude'` |

## Customizing Tool Descriptions

You can customize the descriptions of any tool by setting environment variables. This allows you to tailor tool descriptions to your specific needs without modifying the code.

The environment variable pattern is:

```
MCP_DESC_<TOOL_NAME>="Your custom tool description"
```

Where `<TOOL_NAME>` is the uppercase name of the tool with any non-alphanumeric characters replaced by underscores.

Examples:

```bash
# Custom description for get_config tool
export MCP_DESC_GET_CONFIG="View the current configuration settings for the DevControlMCP server"

# Custom description for execute_command tool
export MCP_DESC_EXECUTE_COMMAND="Run a command in the terminal, with output streaming and timeout support"

# Custom description for read_file tool with more specific details for your environment
export MCP_DESC_READ_FILE="Read a file from your project directory or fetch content from a URL"
```

These environment variables can be set in your shell profile for persistence or right before launching the server.

## Security Notes

- Set `allowedDirectories` to control filesystem access for most tools
- Be cautious when running terminal commands as they have full access to your system
- Use a separate chat for configuration changes
- **`claude_code` tool**: Bypasses internal permission controls and delegates to Claude CLI (requires one-time permission acceptance)
- Monitor the audit logs regularly to track tool usage
- Set appropriate limits for binary file size and line reading to prevent memory exhaustion
- This tool can completely destroy your system, files, projects and even worse... so be careful. By default, DevControlMCP tools have broad permissions. The `claude_code` tool, in particular, operates with full system access by design, bypassing DevControlMCP's specific permission settings.

## What's New

### v0.3.0 - Enhanced Tools from ConduitMCP

This release brings powerful new tools inspired by ConduitMCP, replacing several individual file operations with more capable alternatives:

- **`fetch_url` Tool**: Web content fetching with HTML to Markdown conversion, image compression, and partial content support
- **`find` Tool**: Advanced file search with glob patterns, content matching (regex support), and metadata filtering
- **`write` Tool**: Unified batch file operations supporting put, mkdir, copy, move, delete, and touch in a single transaction
- **Deprecated Tools Removed**: `write_file`, `create_directory`, `move_file`, and `search_files` have been replaced by the new tools
- **URL Support Removed from `read_file`**: Use the dedicated `fetch_url` tool for web content

### v0.2.0 - Core Enhancements

This release includes several improvements from the upstream project:

- **Line-based File Reading**: Files are now read line by line instead of character by character, with configurable limits
- **Streaming File Reading**: Using readline for memory-efficient processing of large files
- **Binary File Protection**: Size limits for binary files to prevent memory exhaustion
- **Audit Logging**: All tool calls are now logged with timestamps and arguments
- **Log Retention Policy**: Automatic cleanup of old log files to prevent unbounded disk usage
- **Fuzzy Search Logging**: Comprehensive logging for edit operations with similarity scores and execution times
- **Logging Utilities**: New npm scripts for viewing, analyzing, exporting, and clearing logs
- **Levenshtein Distance**: Added fastest-levenshtein library for improved string comparison
- **Enhanced Configuration Options**: New options for controlling line limits, binary file size limits, and maximum line counts
- **Customizable Tool Descriptions**: Easily change tool descriptions using environment variables with length validation
- **Claude Code Integration**: New meta-tool for delegating complex tasks to Claude Code CLI instances

All features have been implemented without telemetry, maintaining our commitment to privacy.

## License

This project is licensed under the MIT License.

Original work by Eduard Ruzga.

Modifications (Mostly removal of stuff) starting from commit 3bdaa965b4a77f64a9f8b751680bd1d90e651851 by RDSM.
