# Claude Context: DevControlMCP

This document provides context about DevControlMCP for Claude to better understand the project structure, capabilities, and security model.

## Project Overview

DevControlMCP is an MCP (Model Context Protocol) server that enables Claude Desktop to interact with the local file system and execute terminal commands. It provides a comprehensive set of tools for file operations, terminal management, and system interaction.

## Core Architecture

### Tool Categories
- **Configuration**: `get_config`, `set_config_value`
- **Terminal Operations**: `execute_command`, `read_output`, `force_terminate`, `list_sessions`
- **Process Management**: `list_processes`, `kill_process`
- **File System**: `read_file`, `write_file`, `create_directory`, `list_directory`, `move_file`, `search_files`, `search_code`, `get_file_info`
- **Text Editing**: `edit_block` (surgical text replacements)
- **Meta-Tool**: `claude_code` (delegates to Claude Code CLI)

### Key Implementation Files
- `src/server.ts` - Main MCP server registration and request handling
- `src/handlers/` - Tool-specific request handlers
- `src/tools/` - Core tool implementations
- `src/config-manager.ts` - Configuration management
- `test/` - Comprehensive test suite

## Security Model

### Standard Tools
DevControlMCP implements a permission system for most tools:
- `allowedDirectories`: Controls filesystem access (empty array = full access)
- `blockedCommands`: Prevents execution of dangerous terminal commands
- `defaultShell`: Configures shell for command execution

### Claude Code Meta-Tool
The `claude_code` tool operates with a **different security model**:

⚠️ **IMPORTANT**: The `claude_code` tool bypasses DevControlMCP's internal permission system because it delegates to an external Claude CLI process. Users must run `claude --dangerously-skip-permissions` manually in a separate terminal to accept permissions before using this tool.

**How it works:**
1. Uses TerminalManager to execute Claude CLI as a shell command
2. Initial 30-second timeout determines if task runs asynchronously
3. For long-running tasks: Returns PID immediately for monitoring
4. For quick tasks: Returns complete output directly
5. No maximum lifetime timeout - jobs run indefinitely until completion
6. Operates independently of `allowedDirectories` and `blockedCommands`

**Async Job Management:**
- Tasks exceeding 30 seconds return a PID for status monitoring
- Use `read_output` with PID to check progress and get incremental output
- Use `force_terminate` with PID to stop long-running jobs
- Completed jobs store final output accessible via `read_output`

**Configuration:**
- `claudeCliPath`: Absolute path to Claude CLI executable
- `claudeCliName`: Name of Claude CLI binary (defaults to 'claude')

**Path Resolution Priority:**
1. `claudeCliPath` from config (if absolute path exists)
2. Default local installation at `~/.claude/local/claude`
3. Falls back to `claudeCliName` in system PATH

**Use Cases:**
- Complex multi-step coding tasks
- Advanced Git operations
- Terminal command sequences
- Tasks requiring Claude Code's specialized capabilities
- Large refactoring projects
- Long-running analysis or refactoring operations

## Development Guidelines

### Code Style
- TypeScript throughout the codebase
- Comprehensive error handling with `createErrorResponse()`
- Zod schemas for input validation
- Consistent logging with conditional debug output
- ES modules with `.js` imports in TypeScript

### Testing
- Unit tests for all major components
- Integration tests for tool functionality
- Mock external dependencies appropriately
- Test both success and error scenarios

### Security Considerations
1. **Standard Tools**: Respect permission boundaries, validate paths, sanitize inputs
2. **Claude Code Tool**: Understand it bypasses internal permissions - use responsibly
3. **Error Messages**: Provide clear, actionable feedback without exposing sensitive information
4. **Path Validation**: Always use absolute paths, validate directory existence
5. **Shell Command Safety**: Use `escapeShellArg()` and `buildShellCommand()` utilities from `utils/shell-escape.ts` for safe command construction

## Tool Usage Patterns

### File Operations
- Use `read_file` for single files, `read_multiple_files` for batch operations
- Prefer `edit_block` for small changes, `write_file` for large changes
- Always check file existence and permissions before operations

### Terminal Operations
- Use timeouts for long-running commands
- Capture both stdout and stderr
- Provide process management capabilities (list, kill, read output)

### Meta-Tool Usage
- Use `claude_code` for complex workflows that benefit from Claude Code's specialized capabilities
- Be explicit about security implications when using this tool
- Consider token usage implications for complex tasks

## Configuration Management

The `configManager` provides:
- Persistent configuration storage in `~/.devcontrol-mcp/config.json`
- Default configuration with sensible security defaults
- Runtime configuration updates via `set_config_value`

## Error Handling

All tools should:
- Use `createErrorResponse()` for consistent error formatting
- Provide actionable error messages
- Handle edge cases gracefully
- Log errors appropriately for debugging

## Future Considerations

- The project prioritizes telemetry-free operation
- MIT license ensures open-source accessibility
- Security features may be enhanced over time
- Claude Code integration represents the first "meta-tool" pattern
