# Frequently Asked Questions (FAQ)

This document provides answers to the most commonly asked questions about DevControlMCP. If you can't find an answer to your question here, please check the [GitHub issues](https://github.com/regismesquita/DevControlMCP/issues) for known problems or [open a new issue](https://github.com/regismesquita/DevControlMCP/issues/new) with details about your question.

## Table of Contents

- [General Information](#general-information)
  - [What is DevControlMCP?](#what-is-devcontrolmcp)
  - [How does it differ from coding tools like Cursor or Windsurf?](#how-does-it-differ-from-coding-tools-like-cursor-or-windsurf)
  - [What is an MCP?](#what-is-an-mcp)
  - [Is this an official Anthropic product?](#is-this-an-official-anthropic-product)

- [Cost & Value](#cost--value)
  - [How much does it cost to use Claude DevControlMCP?](#how-much-does-it-cost-to-use-claude-DevControlMCP)
  - [How does the pricing compare to Claude Code or other AI coding tools?](#how-does-the-pricing-compare-to-claude-code-or-other-ai-coding-tools)
  - [Do I need API credits to use this tool?](#do-i-need-api-credits-to-use-this-tool)

- [Installation & Setup](#installation--setup)
  - [What are the prerequisites for using Claude DevControlMCP?](#what-are-the-prerequisites-for-using-claude-DevControlMCP)
  - [How do I install Claude DevControlMCP?](#how-do-i-install-claude-DevControlMCP)
  - [How do I update to the latest version?](#how-do-i-update-to-the-latest-version)
  - [Which operating systems does it support?](#which-operating-systems-does-it-support)

- [Features & Capabilities](#features--capabilities)
  - [What can I do with Claude DevControlMCP?](#what-can-i-do-with-claude-DevControlMCP)
  - [How does it handle file editing?](#how-does-it-handle-file-editing)
  - [Can it help me understand complex codebases?](#can-it-help-me-understand-complex-codebases)
  - [How does it handle long-running commands?](#how-does-it-handle-long-running-commands)
  - [Can I use it for non-coding tasks?](#can-i-use-it-for-non-coding-tasks)

- [Security & Permissions](#security--permissions)
  - [Is it safe to give Claude access to my file system?](#is-it-safe-to-give-claude-access-to-my-file-system)
  - [Can I control which directories Claude can access?](#can-i-control-which-directories-claude-can-access)
  - [What commands are blocked by default?](#what-commands-are-blocked-by-default)
  - [Can I customize the tool descriptions?](#can-i-customize-the-tool-descriptions)

- [Usage Scenarios](#usage-scenarios)
  - [Is it suitable for large codebases?](#is-it-suitable-for-large-codebases)
  - [Can it work with multiple repositories simultaneously?](#can-it-work-with-multiple-repositories-simultaneously)
  - [Is it suitable for non-technical users?](#is-it-suitable-for-non-technical-users)

- [Troubleshooting](#troubleshooting)
  - [Claude says it doesn't have permission to access my files/directories](#claude-says-it-doesnt-have-permission-to-access-my-filesdirectories)
  - [Claude keeps hitting token/output limits](#claude-keeps-hitting-tokenoutput-limits)
  - [Installation fails on my system](#installation-fails-on-my-system)
  - [My custom tool descriptions aren't working](#my-custom-tool-descriptions-arent-working)

- [Best Practices](#best-practices)
  - [What's the recommended workflow for coding?](#whats-the-recommended-workflow-for-coding)
  - [How can I manage changes to avoid losing work?](#how-can-i-manage-changes-to-avoid-losing-work)
  - [Should I still use a code editor?](#should-i-still-use-a-code-editor)

- [Comparison with Other Tools](#comparison-with-other-tools)
  - [How does this compare to VSCode extensions like Cline?](#how-does-this-compare-to-vscode-extensions-like-cline)
  - [Is this better than using Jupyter notebooks with Claude?](#is-this-better-than-using-jupyter-notebooks-with-claude)

---

## General Information

### What is DevControlMCP?

DevControlMCP is an MCP (Model Context Protocol) tool that allows Claude Desktop to access and control your computer's file system and terminal. It enables Claude to explore, read, and write files, execute commands, and manage processes - expanding Claude's capabilities beyond just conversation to become a comprehensive assistant that can work with your entire operating system.

### How does it differ from coding tools like Cursor or Windsurf?

Unlike tools like Cursor or Windsurf which are primarily designed as coding IDEs, DevControlMCP works with Claude to provide a more flexible, solution-centric approach. It's not confined to a coding box - it can handle coding tasks but also excels at exploring codebases, drawing diagrams, running automation processes, and working with multiple projects simultaneously.

The main differences:
- Claude reads full files during exploration, ensuring it captures the complete structure
- Coding tools like Windsurf & Cursor chunk and index files, sometimes missing key relationships
- Claude generates and displays diagrams directly in chat
- Claude DevControlMCP allows you to work across your entire system, not just within coding environments
- Claude lets you execute the changes in one go, rather than requiring constant review and approval

### What is an MCP?

MCP stands for Model Context Protocol. It's a framework that allows AI language models like Claude to interact with external tools and services. MCPs give Claude the ability to perform actions in the real world - in this case, to read and write files, execute terminal commands, and manage processes on your computer.

### Is this an official Anthropic product?

No, DevControlMCP is an independent, open-source project. It is a fork of the DevControlMCP MCP project originally created by Eduards Ruzga, but this fork is maintained by Regis Mesquita. It's not an official Anthropic product, though it works with Anthropic's Claude Desktop application.

## Cost & Value

### How much does it cost to use DevControlMCP?

DevControlMCP itself is free and open-source. However, to use it, you need a Claude Pro subscription, which costs $20/month. There are no additional charges beyond this subscription fee.

### How does the pricing compare to Claude Code or other AI coding tools?

DevControlMCP with Claude Pro is generally more cost-effective than alternatives:
- It costs a flat $20/month (Claude Pro subscription)
- Claude Code uses an API with per-token pricing, which users report can quickly become expensive (some report spending hundreds of dollars)
- Tools like Cursor or Windsurf have their own subscription costs that may be in addition to other AI services

Many users find the flat fee approach more predictable and often more affordable for regular usage.

### Do I need API credits to use this tool?

No. DevControlMCP works with the Claude Desktop application's standard Pro subscription, not with API calls. You won't incur additional costs beyond the Claude Pro subscription fee.

## Installation & Setup

### What are the prerequisites for using DevControlMCP?

You'll need:
- Node.js version 18 or higher installed on your system
- Claude Desktop installed and running
- A Claude Pro subscription ($20/month)

### How do I install DevControlMCP?

There are several ways to install:

**Option 1: Direct installation**
```bash
npx @regismesquita/DevControlMCP setup
```

**Option 2: Manual configuration**
Add the MCP server to your claude_desktop_config.json (on Mac, found at ~/Library/Application\ Support/Claude/claude_desktop_config.json):
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

**Option 3: Local installation**
```bash
git clone https://github.com/regismesquita/DevControlMCP.git
cd DevControlMCP
npm run setup
```

After installation, restart Claude Desktop to see the new tools.

### How do I update to the latest version?

To update manually, you can run the setup command again with your desired version:
```bash
npx @regismesquita/DevControlMCP@<version> setup
```

For example, to install version 0.1.35:
```bash
npx @regismesquita/DevControlMCP@0.1.35 setup
```

Make sure you have Node.js version 18 or higher installed, as older versions may cause issues with the update process.

### Which operating systems does it support?

Claude DevControlMCP works with:
- Windows (ongoing improvements for better Windows support)
- macOS
- Linux (with ongoing enhancements for various distributions)

Work is in progress to improve WSL (Windows Subsystem for Linux) integration and add SSH support for remote servers.

## Features & Capabilities

### What can I do with DevControlMCP?

This streamlined tool focuses on core functionality, enabling a wide range of tasks:

**Code-related tasks:**
- Explore and understand codebases, including generating diagrams
- Read multiple files with the `read_multiple_files` tool
- Create directories with `create_directory`
- Move or rename files with `move_file`
- Get file metadata with `get_file_info`
- Edit files with surgical precision using `edit_block`
- Work with multiple codebases or projects simultaneously
- Find files and search code using terminal commands via `execute_command` (e.g., `find`, `grep`)
- Debug issues by comparing codebases
- Fetch and analyze content from URLs through web search tools

**Automation tasks:**
- Run and manage terminal commands with `execute_command`, including long-running processes
- Track command output with `read_output` and terminate processes with `force_terminate`
- List active terminal sessions with `list_sessions`
- Execute automation scripts and workflows through shell commands
- Process files using command-line tools (compress, convert, encode)
- Monitor system processes with `list_processes` and terminate them with `kill_process`

**System configuration:**
- View server configuration with `get_config`
- Modify configuration settings with `set_config_value`
- Set allowed directories for file operations
- Configure command blocking for security

**Documentation tasks:**
- Generate documentation from code using terminal commands
- Create diagrams of system architecture via text output
- Analyze and summarize codebases
- Produce reports on code quality or structure

### How does it handle file operations?

DevControlMCP provides these core approaches for file operations:

1. **Surgical text replacements (`edit_block`):**
   - Best for small changes (<20% of file size)
   - More precise and less likely to introduce errors
   - Uses a special format to identify text to replace:
   ```
   filepath.ext
   <<<<<<< SEARCH
   existing code to replace
   =======
   new code to insert
   >>>>>>> REPLACE
   ```

2. **Reading files (`read_multiple_files`):**
   - Can read content from multiple files simultaneously
   - Each file's content is returned with its path as a reference
   - Handles text files normally and renders images as viewable content
   - Supports recognized image types: PNG, JPEG, GIF, WebP

3. **File management:**
   - Create directories with `create_directory`
   - Move or rename files with `move_file`
   - Get file metadata with `get_file_info`

4. **Terminal-based operations:**
   - Use standard shell commands through `execute_command` for additional file operations
   - Write files using redirection operators (e.g., `echo "content" > file.txt`)
   - Read files with commands like `cat` or `type`
   - Search content with tools like `grep` or `findstr`
   - Batch process files with shell scripts

This streamlined approach focuses on core functionality while leveraging the power of terminal commands for more specialized operations.

### Can it help me understand complex codebases?

Yes, one of its strengths is codebase exploration. Claude can:
- Navigate through folders and files
- Read and understand code
- Generate diagrams showing relationships between components
- Create summaries of key functionalities
- Identify patterns and architecture
- Explain complex parts of the code

This makes it particularly useful for onboarding to new projects or reviewing unfamiliar repositories.

undefined builds, or extensive searches.

### Can I use it for non-coding tasks?

Absolutely. While it excels at coding-related tasks, Claude DevControlMCP can be used for many system tasks:
- File organization and management
- Media processing (video compression, image conversion)
- System monitoring and maintenance
- Running and managing any terminal-based tools
- Data processing and analysis

## Security & Permissions

### Is it safe to give Claude access to my file system?

Claude DevControlMCP operates within certain safety boundaries:

- While file restrictions are currently disabled, Claude typically only works with files in folders you specifically direct it to
- Claude can only perform actions that your user account has permission to do
- No data is sent to external servers beyond what you share in Claude conversations

> **Note:** Command blocking features are still in development. You should always review the actions Claude proposes before allowing it to make system changes, especially when working with important files or system configurations.

### Can I control which directories Claude can access?

Recent updates have removed path limitations, and work is in progress to add configuration options that will allow you to specify which directories the tool can access. This feature is being developed in [PR #16](https://github.com/regismesquita/DevControlMCP/pull/16).

### What commands are blocked by default?

Claude DevControlMCP doesn't have a pre-defined blocklist, but you can use the `block_command` and `unblock_command` functions to manage which commands Claude can execute. It's recommended to block commands that could potentially be destructive, such as `rm -rf` or `format`.

### Can I customize the tool descriptions?

Yes, DevControlMCP allows you to customize the descriptions for all available tools through environment variables. This gives you the ability to make the tools more intuitive for your specific workflows or clarify functionality that's particularly relevant to your use cases.

#### How to Configure Custom Tool Descriptions

1. **Edit the Configuration File**: 
   - Open your `claude_desktop_config.json` file
   - On Mac: Located at `~/Library/Application Support/Claude/claude_desktop_config.json`
   - On Windows: Located in `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add Environment Variables**:
   - Add or modify the `env` object within your DevControlMCP server configuration
   - Use the naming pattern `MCP_DESC_TOOLNAME` for each tool description you want to customize

#### Example Configuration Structure

```json
{
  "mcpServers": {
    "DevControlMCP": {
      "command": "npx",
      "args": [
        "-y",
        "@regismesquita/DevControlMCP"
      ],
      "env": {
        "MCP_DESC_get_config": "Get current server configuration and settings",
        "MCP_DESC_execute_command": "Run a shell command with an optional timeout",
        "MCP_DESC_read_output": "Get output from currently running command"
      }
    }
  }
}
```

#### Naming Convention

The format always follows this pattern: `MCP_DESC_` + tool name

Examples:
- For the `get_config` tool → use `MCP_DESC_get_config`
- For the `execute_command` tool → use `MCP_DESC_execute_command`
- For the `read_multiple_files` tool → use `MCP_DESC_read_multiple_files`

#### Complete List of Available Tools for Customization

All available tools that can be customized:
- `get_config` - Get server configuration as JSON
- `set_config_value` - Set a specific configuration value
- `execute_command` - Run a terminal command
- `read_output` - Read output from a running terminal session
- `force_terminate` - Stop a running terminal session
- `list_sessions` - List all active terminal sessions
- `list_processes` - List all running processes
- `kill_process` - Terminate a process by PID
- `read_multiple_files` - Read multiple files at once
- `create_directory` - Create a new directory
- `move_file` - Move or rename files
- `get_file_info` - Get file metadata
- `edit_block` - Make surgical text replacements

#### Fallback Behavior

If you provide an empty string or just whitespace as a description (e.g., `"MCP_DESC_get_config": ""`), the tool will automatically fall back to using its default description.

#### Benefits of Custom Descriptions

- **Clearer documentation**: Customize descriptions to be more relevant to your specific use cases
- **Workflow optimization**: Highlight the most important functionality for your team
- **Better context**: Provide team-specific context or examples in the descriptions
- **Simplified explanations**: Make complex tools more approachable with simpler descriptions

## Usage Scenarios

### Is it suitable for large codebases?

Yes, users have reported success with very large codebases (one user mentioned 44k files with 11 million code lines). Claude can effectively:
- Navigate and understand the structure
- Find specific information using the search tools
- Make targeted changes across multiple files
- Generate diagrams and documentation to help visualization

For extremely large monorepo projects, you may need to direct Claude to specific directories or components rather than trying to process the entire codebase at once.

### Can it work with multiple repositories simultaneously?

Yes, one of Claude DevControlMCP's strengths is its ability to work across different projects or repositories at the same time. This is particularly useful for:
- Migrating features between codebases
- Comparing implementations
- Applying consistent changes across multiple projects
- Understanding relationships between separate but related components

### Is it suitable for non-technical users?

Claude DevControlMCP requires some basic technical knowledge, particularly:
- Understanding of file systems
- Basic terminal/command line knowledge
- Ability to install and configure Node.js applications

For complete beginners, platforms like Loveable might be easier as they handle deployment and server-side aspects. However, if you're comfortable with basic technical concepts and want more control, Claude DevControlMCP can be a good option, especially if you've had issues with other platforms.

## Troubleshooting

Before diving into specific issues, check the [GitHub issues page](https://github.com/regismesquita/DevControlMCP/issues) to see if your problem has already been reported and if there are any solutions or workarounds. If you discover a new issue, please consider [opening a GitHub issue](https://github.com/regismesquita/DevControlMCP/issues/new) to help improve the tool for everyone.

### Claude says it doesn't have permission to access my files/directories

Recent updates have removed directory restrictions. If you're still experiencing this issue:
1. Make sure you've installed the latest version
2. Restart Claude Desktop completely
3. When Claude asks for permission to use tools, approve for the entire chat
4. Check if there are any specific permission issues with the directory in question (file permissions, etc.)

### Claude keeps hitting token/output limits

Claude Desktop has certain limits on message size. When working with large codebases or extensive outputs, you might encounter these limits. Some strategies to work around them:

1. Ask Claude to focus on specific parts of the codebase rather than the entire thing
2. For long-running commands, use the PID to check progress periodically rather than keeping the entire output
3. Request summarized information instead of full file contents
4. Break complex tasks into smaller steps
5. Create new chats for different aspects of your project

### Installation fails on my system

If you're having trouble installing Claude DevControlMCP:

1. Check Node.js version: `node -v` (should be v18 or higher)
2. Ensure you have proper permissions to install npm packages
3. On Windows, try running your terminal as Administrator
4. Check if there are any specific errors in the installation output
5. Try the manual installation method (Option 3 in the installation instructions)

For persistent issues, create an issue on the [GitHub repository](https://github.com/regismesquita/DevControlMCP/issues/new).

### My custom tool descriptions aren't working

If your custom tool descriptions aren't being applied:

1. **Check your configuration structure**: 
   - Make sure you're using the correct JSON structure (see example below)
   - The `env` object should be inside your DevControlMCP server configuration
   - The complete path should be `mcpServers.DevControlMCP.env.MCP_DESC_toolname`

   ```json
   {
     "mcpServers": {
       "DevControlMCP": {
         "command": "npx",
         "args": ["-y", "@regismesquita/DevControlMCP"],
         "env": {
           "MCP_DESC_get_config": "Your custom description here"
         }
       }
     }
   }
   ```

2. **Verify naming convention**: 
   - Ensure you're using the correct naming pattern (`MCP_DESC_toolname`)
   - Double-check that tool names match exactly (e.g., `MCP_DESC_get_config`, not `MCP_DESC_getconfig`)
   - Remember that tool names are case-sensitive

3. **Restart Claude Desktop completely** after making changes:
   - Close the application entirely (not just the window)
   - Wait a few seconds before reopening
   - This ensures the new configuration is loaded

4. **Check for empty descriptions**:
   - Make sure your descriptions aren't just whitespace 
   - Empty or whitespace-only descriptions will fall back to the default
   - Descriptions must have actual content to override defaults

5. **Validate your JSON**:
   - Check for syntax errors (missing commas, quotes, etc.)
   - Ensure proper nesting of objects
   - Consider using a JSON validator if you're unsure

6. **Start simple**:
   - Try setting just one custom description first to isolate any issues
   - Once that works, add more descriptions incrementally

7. **Verify file permissions**:
   - Ensure your `claude_desktop_config.json` file has proper read permissions
   - Check that you have write permissions if you're modifying the file

8. **Check logs**:
   - If available, check Claude Desktop logs for any configuration errors
   - Error messages might provide clues about what's wrong

## Best Practices

### What's the recommended workflow for coding?

Many users recommend the following workflow:

1. **Plan first:** Ask Claude to analyze the problem and outline a solution before making changes
2. **Focus on working code:** Let Claude implement changes to get the code working first
3. **Review after it works:** Only review the code in detail after confirming it runs
4. **Version control:** Use git or another version control system to track changes
5. **Stage and commit:** Make regular commits after verifying changes work
6. **Test integration:** Have Claude run tests to ensure changes don't break existing functionality

For larger projects, consider asking Claude to implement changes in logical chunks rather than all at once.

### How can I manage changes to avoid losing work?

To ensure you don't lose important work:

1. Always use version control (git) when working on code projects
2. Stage changes and commit when appropriate to be able to roll back if needed
3. For significant changes, consider having Claude create a new branch first
4. Review changes before committing them, especially for critical code
5. Ask Claude to explain its changes and reasoning
6. Back up important files before major modifications
7. Use the `edit_block` approach for precise, controlled changes when possible

### Should I still use a code editor?

Yes, for most users, having a code editor is still valuable. Claude DevControlMCP works well alongside traditional development tools, rather than completely replacing them.

Typical workflow:
1. Use Claude to implement changes or explore code
2. Review the changes in your preferred code editor
3. Make any additional adjustments manually if needed
4. Use your editor for debugging, advanced features, or specific language tooling
5. Commit changes using your normal workflow

Some users report reviewing code only after Claude has made it work, focusing on understanding and quality rather than writing from scratch.

## Comparison with Other Tools

### How does this compare to VSCode extensions like Cline?

Tools like Cline are great options that integrate directly with VSCode. The main differences are:

**Claude DevControlMCP:**
- Works across your entire system, not just within the editor
- Can handle automation, terminal commands, and long-running processes
- Fixed cost with Claude Pro subscription
- More flexible approach not tied to a specific editor
- Better for tasks beyond just coding

**Cline and similar extensions:**
- Tightly integrated with the editor experience
- May be more convenient for pure coding workflows
- Some extensions use API calls which can incur additional costs
- Better editor-specific features (syntax highlighting, IntelliSense integration)

Many users employ both, using the right tool for different tasks.

### Is this better than using Jupyter notebooks with Claude?

Jupyter notebooks and Claude DevControlMCP serve different purposes:

**Claude DevControlMCP:**
- System-wide access to files and terminal
- Can work with any project type or language
- Full development workflow support
- Better for production code and real projects

**Jupyter with Claude:**
- Better for data analysis and exploration
- Excellent for step-by-step learning and documentation
- Visual output for data visualization
- More structured for educational purposes

For data science or analysis projects, you might use both: Claude DevControlMCP for system tasks and code management, and Jupyter for interactive exploration and visualization.
