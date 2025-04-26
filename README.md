# DevControlMCP

> **IMPORTANT NOTE**: This project was originally based on the wonderwhy-er/Desktop Commander project. It started as a telemetry-free version and has been transformed into a full fork with additional features and improvements.

## Overview

DevControlMCP is an MCP (Model Context Protocol) tool that enables Claude desktop app to execute terminal commands and interact with your file system. It turns Claude into a powerful assistant for coding, system management, and file operations.

## Features

- **Terminal Operations**: Execute commands with output streaming, timeouts, and background execution
- **Process Management**: List and manage running processes
- **File Operations**: Read/write files, create/list directories, move files, and get metadata
- **Advanced Search**: Find files by name or search within file contents using ripgrep
- **Code Editing**: Make surgical text replacements or full file rewrites
- **URL Content**: Fetch and process content from URLs

## Installation

### Prerequisites
- Node.js v18 or higher
- Claude Desktop app with Pro subscription

### Quick Install
```bash
npx @regismesquita/DevControlMCP setup
```

For debugging mode:
```bash
npx @regismesquita/DevControlMCP setup --debug
```

### Manual Configuration
Add to your claude_desktop_config.json:
```json
{
  "mcpServers": {
    "DevControlMCP": {
      "command": "npx",
      "args": [
        "-y",
        "@regismesquita/DevControlMCP"
      ]
    }
  }
}
```

### Local Installation
```bash
git clone https://github.com/regismesquita/DevControlMCP.git
cd DevControlMCP
npm run setup
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

## Text Editing Example

```
filepath.ext
<<<<<<< SEARCH
content to find
=======
new content
>>>>>>> REPLACE
```

## Security Notes

- Set `allowedDirectories` to control filesystem access
- Be cautious when running terminal commands as they have full access to your system
- Use a separate chat for configuration changes

## License

MIT
