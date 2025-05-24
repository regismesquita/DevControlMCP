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
  - [What is the claude_code tool and when should I use it?](#what-is-the-claude_code-tool-and-when-should-i-use-it)

- [Security & Permissions](#security--permissions)
  - [Is it safe to give Claude access to my file system?](#is-it-safe-to-give-claude-access-to-my-file-system)
  - [Can I control which directories Claude can access?](#can-i-control-which-directories-claude-can-access)
  - [What commands are blocked by default?](#what-commands-are-blocked-by-default)
  - [How does the claude_code tool interact with DevControlMCP's permissions?](#how-does-the-claude_code-tool-interact-with-devcontrolmcps-permissions)

- [Usage Scenarios](#usage-scenarios)
  - [Is it suitable for large codebases?](#is-it-suitable-for-large-codebases)
  - [Can it work with multiple repositories simultaneously?](#can-it-work-with-multiple-repositories-simultaneously)
  - [Is it suitable for non-technical users?](#is-it-suitable-for-non-technical-users)

- [Troubleshooting](#troubleshooting)
  - [Claude says it doesn't have permission to access my files/directories](#claude-says-it-doesnt-have-permission-to-access-my-filesdirectories)
  - [Claude keeps hitting token/output limits](#claude-keeps-hitting-tokenoutput-limits)
  - [Installation fails on my system](#installation-fails-on-my-system)

- [Best Practices](#best-practices)
  - [What's the recommended workflow for coding?](#whats-the-recommended-workflow-for-coding)
  - [How can I manage changes to avoid losing work?](#how-can-i-manage-changes-to-avoid-losing-work)
  - [Should I still use a code editor?](#should-i-still-use-a-code-editor)

- [Comparison with Other Tools](#comparison-with-other-tools)
  - [How does this compare to VSCode extensions like Cline?](#how-does-this-compare-to-vscode-extensions-like-cline)
  - [Is this better than using Jupyter notebooks with Claude?](#is-this-better-than-using-jupyter-notebooks-with-claude)

- [Migration Guide](#migration-guide)
  - [What tools have been deprecated in v0.3.0?](#what-tools-have-been-deprecated-in-v030)
  - [How do I migrate from the old tools to the new ones?](#how-do-i-migrate-from-the-old-tools-to-the-new-ones)
  - [Why were these changes made?](#why-were-these-changes-made)

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
- Claude CLI installed globally (optional, for `claude_code` tool) - install with `npm run install:claude-cli`

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

The tool enables a wide range of tasks:

**Code-related tasks:**
- Explore and understand codebases, including generating diagrams
- Read, write, and edit files with surgical precision
- Work with multiple codebases or projects simultaneously
- Perform comprehensive code searches across directories with timeout protection
- Debug issues by comparing codebases
- Fetch and analyze content from URLs

**Automation tasks:**
- Run and manage terminal commands, including long-running processes
- Execute automation scripts and workflows
- Compress files, convert formats, encode videos
- Monitor system processes

**Documentation tasks:**
- Generate documentation from code
- Create diagrams of system architecture
- Analyze and summarize codebases
- Produce reports on code quality or structure

### How does it handle file editing and URL content?

DevControlMCP provides multiple approaches to file manipulation and web content:

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

2. **Batch file operations (`write` tool):**
   - Unified tool for all file write operations
   - Supports multiple operations in a single transaction:
     - `put`: Write or append file content (text or base64)
     - `mkdir`: Create directories with optional recursive creation
     - `copy`: Copy files or directories
     - `move`: Move or rename files/directories
     - `delete`: Remove files or directories
     - `touch`: Create empty files or update timestamps
   - Each operation succeeds/fails independently with detailed error reporting

3. **Web content retrieval (`fetch_url`):**
   - Dedicated tool for fetching web content
   - HTML to Markdown conversion using Mozilla's Readability
   - Image compression for large images
   - Support for partial content fetching
   - 30-second default timeout

4. **Advanced file search (`find`):**
   - Powerful search with glob patterns, content matching, and metadata filters
   - Combines multiple criteria with AND logic
   - Replaces the old `search_files` tool with more capabilities

### Can it help me understand complex codebases?

Yes, one of its strengths is codebase exploration. Claude can:
- Navigate through folders and files
- Read and understand code
- Generate diagrams showing relationships between components
- Create summaries of key functionalities
- Identify patterns and architecture
- Explain complex parts of the code

This makes it particularly useful for onboarding to new projects or reviewing unfamiliar repositories.

### How does it handle long-running commands and searches?

Claude DevControlMCP has a sophisticated system for managing commands and operations that may take a while to complete:

1. The `execute_command` function returns after a timeout with initial output
2. The command continues running in the background
3. You can use `read_output` with the PID to get new output as it becomes available
4. You can use `force_terminate` to stop the command if needed

For search operations:
1. Both `search_files` and `search_code` have a default 30-second timeout
2. This prevents searches from hanging indefinitely on large codebases
3. You can customize the timeout duration with the `timeoutMs` parameter
4. If a search times out, you'll receive a clear message indicating the timeout

This allows Claude to manage processes that would normally exceed conversation timeouts, such as video encoding, large file operations, complex builds, or extensive searches.

### Can I use it for non-coding tasks?

Absolutely. While it excels at coding-related tasks, Claude DevControlMCP can be used for many system tasks:
- File organization and management
- Media processing (video compression, image conversion)
- System monitoring and maintenance
- Running and managing any terminal-based tools
- Data processing and analysis

### What is the claude_code tool and when should I use it?

The `claude_code` tool is a "meta-tool" that allows DevControlMCP to delegate complex tasks directly to Claude Code CLI instances. It's essentially Claude calling another Claude instance with specialized capabilities.

**When to use `claude_code`:**
- **Complex multi-step tasks**: When you need a sequence of operations that would normally require multiple tool calls
- **Advanced Git workflows**: Complex branching, merging, rebasing, or repository management
- **Specialized Claude Code features**: Tasks that benefit from Claude Code's specific capabilities like advanced web research
- **Terminal command sequences**: When you need to run multiple related commands in a specific context
- **Large refactoring tasks**: When you need to make coordinated changes across many files

**Example use cases:**
```json
{
  "prompt": "Set up a new React project with TypeScript, configure ESLint and Prettier, and create a basic component structure",
  "workFolder": "/Users/username/projects/my-app",
  "tools": ["Bash", "Read", "Write", "Edit"]
}
```

**Benefits:**
- Leverages Claude Code's specialized capabilities
- Can handle complex workflows that would be challenging with individual tools
- Provides access to Claude Code's web search and research capabilities
- Allows for more sophisticated decision-making in multi-step processes

**Important considerations:**
- Requires Claude CLI to be installed and configured (`npm run install:claude-cli`)
- Bypasses DevControlMCP's permission system (operates with full system access)
- Best suited for users comfortable with the security implications
- May incur higher token usage for complex tasks

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

### How does the claude_code tool interact with DevControlMCP's permissions?

The `claude_code` tool operates differently from other DevControlMCP tools regarding permissions:

**⚠️ Important Security Note:**
- The `claude_code` tool **bypasses** DevControlMCP's internal permission system (`allowedDirectories`, `blockedCommands`)
- It delegates tasks to an external Claude CLI process that runs with `--dangerously-skip-permissions`
- This means it has full system access regardless of your DevControlMCP configuration

**Setup Requirements:**
1. Install Claude CLI: `npm run install:claude-cli`
2. One-time setup: Run `claude --dangerously-skip-permissions` and accept the prompts
3. After setup, the tool works without further permission prompts

**When to Use:**
- Complex multi-step coding tasks that require multiple tool interactions
- Advanced Git operations and terminal command sequences
- Tasks that benefit from Claude Code's specialized capabilities
- When you need to delegate entire workflows to a Claude instance

**Security Considerations:**
- Only use this tool when you trust the prompts you're giving it
- Be especially careful with system-wide operations
- Consider the tool as having the same permissions as running `claude` CLI directly
- The tool is designed for advanced users who understand the security implications

**Configuration:**
You can configure the Claude CLI path in your DevControlMCP config:
```json
{
  "claudeCliPath": "/custom/path/to/claude",
  "claudeCliName": "claude-custom"
}
```

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

## Migration Guide

### What tools have been deprecated in v0.3.0?

The following tools have been removed and replaced with more capable alternatives:

**Deprecated Tools:**
- `write_file` - Replaced by the `write` tool's `put` operation
- `create_directory` - Replaced by the `write` tool's `mkdir` operation  
- `move_file` - Replaced by the `write` tool's `move` operation
- `search_files` - Replaced by the more powerful `find` tool
- URL support in `read_file` - Now use the dedicated `fetch_url` tool

### How do I migrate from the old tools to the new ones?

Here's a quick migration guide for each deprecated tool:

**1. From `write_file` to `write` tool:**
```json
// Old way
{
  "tool": "write_file",
  "path": "/path/to/file.txt",
  "content": "File content"
}

// New way
{
  "tool": "write",
  "operations": [{
    "type": "put",
    "path": "/path/to/file.txt",
    "content": "File content"
  }]
}
```

**2. From `create_directory` to `write` tool:**
```json
// Old way
{
  "tool": "create_directory",
  "path": "/path/to/new/directory"
}

// New way
{
  "tool": "write",
  "operations": [{
    "type": "mkdir",
    "path": "/path/to/new/directory",
    "recursive": true
  }]
}
```

**3. From `move_file` to `write` tool:**
```json
// Old way
{
  "tool": "move_file",
  "source": "/path/from/file.txt",
  "destination": "/path/to/file.txt"
}

// New way
{
  "tool": "write",
  "operations": [{
    "type": "move",
    "source": "/path/from/file.txt",
    "destination": "/path/to/file.txt",
    "overwrite": true
  }]
}
```

**4. From `search_files` to `find` tool:**
```json
// Old way
{
  "tool": "search_files",
  "path": "/path/to/search",
  "pattern": "test"
}

// New way
{
  "tool": "find",
  "base_path": "/path/to/search",
  "recursive": true,
  "match_criteria": [{
    "type": "name_pattern",
    "pattern": "*test*"
  }]
}
```

**5. From `read_file` with URL to `fetch_url`:**
```json
// Old way
{
  "tool": "read_file",
  "path": "https://example.com/page",
  "isUrl": true
}

// New way
{
  "tool": "fetch_url",
  "url": "https://example.com/page",
  "format": "markdown"
}
```

### Why were these changes made?

The new tools provide several advantages:

1. **Batch Operations**: The `write` tool allows multiple file operations in a single call, reducing the number of tool invocations needed for complex tasks.

2. **More Powerful Search**: The `find` tool combines name patterns (with glob support), content search (with regex), and metadata filtering, making it much more capable than the simple substring matching of `search_files`.

3. **Better Web Content Handling**: The dedicated `fetch_url` tool provides HTML to Markdown conversion, image compression, and better error handling specifically designed for web content.

4. **Consistency**: All file write operations are now handled through a single, unified interface, making the API more predictable and easier to use.

5. **Error Handling**: Each operation in a batch can succeed or fail independently, providing more granular error reporting and partial success scenarios.

These changes were inspired by the ConduitMCP project, which demonstrated more efficient patterns for file and web operations.
