import { homedir, platform } from 'os';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from "node:child_process";
import { version as nodeVersion } from 'process';

// Fix for Windows ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine OS and set appropriate config path
const os = platform();
const isWindows = os === 'win32'; // Define isWindows variable
let claudeConfigPath;

switch (os) {
    case 'win32':
        claudeConfigPath = join(process.env.APPDATA, 'Claude', 'claude_desktop_config.json');
        break;
    case 'darwin':
        claudeConfigPath = join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
        break;
    case 'linux':
        claudeConfigPath = join(homedir(), '.config', 'Claude', 'claude_desktop_config.json');
        break;
    default:
        // Fallback for other platforms
        claudeConfigPath = join(homedir(), '.claude_desktop_config.json');
}

// Setup logging
const LOG_FILE = join(__dirname, 'setup.log');

function logToFile(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${isError ? 'ERROR: ' : ''}${message}\n`;
    try {
        appendFileSync(LOG_FILE, logMessage);
        // For setup script, we'll still output to console but in JSON format
        const jsonOutput = {
            type: isError ? 'error' : 'info',
            timestamp,
            message
        };
        process.stdout.write(JSON.stringify(jsonOutput) + '\n');
    } catch (err) {
        // Last resort error handling
        process.stderr.write(JSON.stringify({
            type: 'error',
            timestamp: new Date().toISOString(),
            message: `Failed to write to log file: ${err.message}`
        }) + '\n');
    }
}

async function execAsync(command) {
    return new Promise((resolve, reject) => {
      // Use PowerShell on Windows for better Unicode support and consistency
      const actualCommand = isWindows
      ? `cmd.exe /c ${command}`
      : command;

      exec(actualCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });
}

async function restartClaude() {
    try {
        const platform = process.platform
        // ignore errors on windows when claude is not running.
        // just silently kill the process
        try  {
            switch (platform) {
                case "win32":
                    await execAsync(
                        `taskkill /F /IM "Claude.exe"`,
                    )
                    break;
                case "darwin":
                    await execAsync(
                        `killall "Claude"`,
                    )
                    break;
                case "linux":
                    await execAsync(
                        `pkill -f "claude"`,
                    )
                    break;
            }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 3000))
        try {
            if (platform === "win32") {
                // it will never start claude
                // await execAsync(`start "" "Claude.exe"`)
            } else if (platform === "darwin") {
                await execAsync(`open -a "Claude"`)
            } else if (platform === "linux") {
                await execAsync(`claude`)
            }
            logToFile(`Claude has been restarted.`)
        } catch {
            // Silent fail
        }
    } catch (error) {
        logToFile(`Failed to restart Claude: ${error}. Please restart it manually.`, true)
        logToFile(`If Claude Desktop is not installed use this link to download https://claude.ai/download`, true)
    }
}

// Check if config file exists and create default if not
if (!existsSync(claudeConfigPath)) {
    logToFile(`Claude config file not found at: ${claudeConfigPath}`);
    logToFile('Creating default config file...');
    
    // Create the directory if it doesn't exist
    const configDir = dirname(claudeConfigPath);
    if (!existsSync(configDir)) {
        import('fs').then(fs => fs.mkdirSync(configDir, { recursive: true }));
    }
    
    // Create default config with shell based on platform
    const defaultConfig = {
        "serverConfig": isWindows
            ? {
                "command": "cmd.exe",
                "args": ["/c"]
              }
            : {
                "command": "/bin/sh",
                "args": ["-c"]
              }
    };
    
    writeFileSync(claudeConfigPath, JSON.stringify(defaultConfig, null, 2));
    logToFile('Default config file created. Please update it with your Claude API credentials.');
}

// Function to check for debug mode argument
function isDebugMode() {
    return process.argv.includes('--debug');
}

// Main function to export for ESM compatibility
export default async function setup() {
    const debugMode = isDebugMode();
    if (debugMode) {
        logToFile('Debug mode enabled. Will configure with Node.js inspector options.');
    }
    try {
        // Read existing config
        const configData = readFileSync(claudeConfigPath, 'utf8');
        const config = JSON.parse(configData);

        // Prepare the new server config based on OS
        // Determine if running through npx or locally
        const isNpx = import.meta.url.includes('node_modules');

        // Fix Windows path handling for npx execution
        let serverConfig;
        
        if (debugMode) {
            // Use Node.js with inspector flag for debugging
            if (isNpx) {
                // Debug with npx
                logToFile('Setting up debug configuration with npx. The process will pause on start until a debugger connects.');
                // Add environment variables to help with debugging
                const debugEnv = {
                    "NODE_OPTIONS": "--trace-warnings --trace-exit",
                    "DEBUG": "*"
                };
                
                serverConfig = {
                    "command": isWindows ? "node.exe" : "node",
                    "args": [
                        "--inspect-brk=9229",
                        isWindows ? 
                            join(process.env.APPDATA || '', "npm", "npx.cmd").replace(/\\/g, '\\\\') : 
                            "$(which npx)",
                        "@regismesquita/DevControlMCP"
                    ],
                    "env": debugEnv
                };
            } else {
                // Debug with local installation path
                const indexPath = join(__dirname, 'dist', 'index.js');
                logToFile('Setting up debug configuration with local path. The process will pause on start until a debugger connects.');
                // Add environment variables to help with debugging
                const debugEnv = {
                    "NODE_OPTIONS": "--trace-warnings --trace-exit",
                    "DEBUG": "*"
                };
                
                serverConfig = {
                    "command": isWindows ? "node.exe" : "node",
                    "args": [
                        "--inspect-brk=9229",
                        indexPath.replace(/\\/g, '\\\\') // Double escape backslashes for JSON
                    ],
                    "env": debugEnv
                };
            }
        } else {
            // Standard configuration without debug
            if (isNpx) {
                serverConfig = {
                    "command": isWindows ? "npx.cmd" : "npx",
                    "args": [
                        "@regismesquita/DevControlMCP"
                    ]
                };
            } else {
                // For local installation, use absolute path to handle Windows properly
                const indexPath = join(__dirname, 'dist', 'index.js');
                serverConfig = {
                    "command": "node",
                    "args": [
                        indexPath.replace(/\\/g, '\\\\') // Double escape backslashes for JSON
                    ]
                };
            }
        }

        // Initialize mcpServers if it doesn't exist
        if (!config.mcpServers) {
            config.mcpServers = {};
        }

        // Check if any old servers exist and remove them
        const oldServers = ["desktopCommander", "desktop-commander-telemetry-free"];
        for (const oldServer of oldServers) {
            if (config.mcpServers[oldServer]) {
                logToFile(`Found old "${oldServer}" installation. Removing it...`);
                delete config.mcpServers[oldServer];
            }
        }

        // Add or update the terminal server config with the proper name "DevControlMCP"
        config.mcpServers["DevControlMCP"] = serverConfig;

        // Write the updated config back
        writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2), 'utf8');
        logToFile('Successfully added MCP server to Claude configuration!');
        logToFile(`Configuration location: ${claudeConfigPath}`);
        
        if (debugMode) {
            logToFile('\nTo use the debug server:\n1. Restart Claude if it\'s currently running\n2. The server will be available as "DevControlMCP-debug" in Claude\'s MCP server list\n3. Connect your debugger to port 9229');
        } else {
            logToFile('\nTo use the server:\n1. Restart Claude if it\'s currently running\n2. The server will be available as "DevControlMCP" in Claude\'s MCP server list');
        }

        await restartClaude();
        
    } catch (error) {
        logToFile(`Error updating Claude configuration: ${error}`, true);
        process.exit(1);
    }
}

// Allow direct execution
if (process.argv.length >= 2 && process.argv[1] === fileURLToPath(import.meta.url)) {
    setup().catch(error => {
        logToFile(`Fatal error: ${error}`, true);
        process.exit(1);
    });
}