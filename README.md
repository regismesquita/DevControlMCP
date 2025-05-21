**Before we start: This thing can completely destroy your system, files , projects and even worse... so be careful. By default this thing has permission to do whatever it wants on your computer.**

# DevControlMCP

> **IMPORTANT NOTE**: This project is originally based on the [wonderwhy-er/DesktopCommanderMCP](https://github.com/wonderwhy-er/DesktopCommanderMCP) project. It started as a telemetry-free version and has been transformed into a full fork, the main difference is that it is telemetry free and the license will always be MIT. no new features or anything, actually we will probably be behind the main version and we may strip some features down to keep the bare minimum and avoid tool bloating.  but no telmetry. no license change.

## Overview

DevControlMCP is an MCP (Model Context Protocol) tool that enables Claude desktop app to execute terminal commands and interact with your file system. It turns Claude into a powerful assistant for coding, system management, and file operations.

## Features

- **Terminal Operations**: Execute commands with output streaming, timeouts, and background execution
- **Process Management**: List and manage running processes
- **File Operations**: Read/write files, create/list directories, move files, and get metadata
- **Advanced Search**: Find files by name or search within file contents using ripgrep
- **Code Editing**: Make surgical text replacements or full file rewrites
- **URL Content**: Fetch and process content from URLs
- **Claude Code Integration**: Delegate complex tasks to Claude Code CLI instances via the `claude_code` meta-tool

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
The `claude_code` tool requires the Claude CLI to be installed and configured:

```bash
# Install Claude CLI
npm run install:claude-cli

# One-time permission acceptance (required)
claude --dangerously-skip-permissions
# Follow the prompts to accept permissions
```

**Note**: The `--dangerously-skip-permissions` flag is required for the `claude_code` tool to function without interactive prompts.

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
| **Filesystem** | `read_file` | Read local files or URLs |
| | `read_multiple_files` | Read multiple files at once |
| | `write_file` | Write to a file (replace contents) |
| | `create_directory` | Create a new directory |
| | `list_directory` | List files/directories |
| | `move_file` | Move or rename files |
| | `search_files` | Find files by name |
| | `search_code` | Search for patterns in file contents |
| | `get_file_info` | Get file metadata |
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

⚠️ **IMPORTANT**: The `claude_code` tool bypasses DevControlMCP's internal permission system (`allowedDirectories`, `blockedCommands`) because it delegates to an external Claude CLI process. The Claude CLI operates with its own (skipped) permissions.

## Security Notes

- Set `allowedDirectories` to control filesystem access for most tools
- Be cautious when running terminal commands as they have full access to your system
- Use a separate chat for configuration changes
- **`claude_code` tool**: Bypasses internal permission controls and delegates to external Claude CLI with `--dangerously-skip-permissions` 
- This tool can completely destroy your system, files, projects and even worse... so be careful. By default this tool has permission to do whatever it wants on your computer.

## Configuration Options

The following configuration options are available via `set_config_value`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowedDirectories` | Array | `[]` | Paths accessible to filesystem tools (empty = all access) |
| `blockedCommands` | Array | See defaults | Commands blocked from execution |
| `defaultShell` | String | Platform-dependent | Default shell for command execution |
| `claudeCliPath` | String | `undefined` | Absolute path to Claude CLI executable |
| `claudeCliName` | String | `'claude'` | Name of Claude CLI binary |

## License

This project is licensed under the MIT License.

Original work by Eduard Ruzga.

Modifications (Mostly removal of stuff) starting from commit 3bdaa965b4a77f64a9f8b751680bd1d90e651851 by RDSM.
