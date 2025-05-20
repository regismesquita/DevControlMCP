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
- **Line-based File Reading**: Read files with line offset and limits for better handling of large files
- **Audit Logging**: Track all tool calls with automatic log rotation
- **Fuzzy Search Logging**: Comprehensive logging and troubleshooting for search operations

## Installation

### Prerequisites
- Node.js v18 or higher
- Claude Desktop app with Pro subscription

### Quick Install

### Local Installation
```bash
git clone https://github.com/regismesquita/DevControlMCP.git
cd DevControlMCP
npm run setup
```

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
| **Filesystem** | `read_file` | Read local files or URLs with line offset and limits |
| | `read_multiple_files` | Read multiple files at once |
| | `write_file` | Write to a file (replace contents) |
| | `create_directory` | Create a new directory |
| | `list_directory` | List files/directories |
| | `move_file` | Move or rename files |
| | `search_files` | Find files by name |
| | `search_code` | Search for patterns in file contents |
| | `get_file_info` | Get file metadata |
| **Text Editing** | `edit_block` | Make surgical text replacements |

## Text Editing Example

```
filepath.ext
<<<<<<< SEARCH
content to find
=======
new content
>>>>>>> REPLACE
```

## Configuration Options

The following configuration options can be set using the `set_config_value` tool:

| Option | Description | Default |
|--------|-------------|---------|
| `allowedDirectories` | Directories that can be accessed (empty array for full access) | `[]` |
| `blockedCommands` | Commands that cannot be executed | Various system commands |
| `defaultShell` | Shell to use for command execution | `bash` (Unix) or `powershell.exe` (Windows) |
| `fileReadLineLimit` | Maximum number of lines to read from a file | `1000` |
| `fileWriteLineLimit` | Maximum number of lines to write to a file | `50` |

## Security Notes

- Set `allowedDirectories` to control filesystem access
- Be cautious when running terminal commands as they have full access to your system
- Use a separate chat for configuration changes
- This thing can completely destroy your system, files , projects and even worse... so be careful. By default this thing has permission to do whatever it wants on your computer.

## What's New in v0.2.0

This release includes several improvements from the upstream project:

- **Line-based File Reading**: Files are now read line by line instead of character by character, with configurable limits
- **Audit Logging**: All tool calls are now logged with timestamps and arguments
- **Fuzzy Search Logging**: Comprehensive logging for edit operations with similarity scores and execution times
- **Logging Utilities**: New npm scripts for viewing, analyzing, exporting, and clearing logs
- **Levenshtein Distance**: Added fastest-levenshtein library for improved string comparison
- **Configuration Options**: New options for controlling line-based file reading and writing

All features have been implemented without telemetry, maintaining our commitment to privacy.

## License

This project is licensed under the MIT License.

Original work by Eduard Ruzga.

Modifications (Mostly removal of stuff) starting from commit 3bdaa965b4a77f64a9f8b751680bd1d90e651851 by RDSM.
