import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import os from 'os';

export interface ServerConfig {
  blockedCommands?: string[];
  defaultShell?: string;
  allowedDirectories?: string[];
  claudeCliPath?: string; // Absolute path to the Claude CLI executable
  claudeCliName?: string; // Name of the Claude CLI binary (e.g., 'claude', 'claude-custom')
  fileWriteLineLimit?: number; // Line limit for file write operations
  fileReadLineLimit?: number; // Default line limit for file read operations
  maxLineCountLimit?: number; // Maximum line count in files (prevents memory issues)
  binaryFileSizeLimit?: number; // Maximum size for binary files in bytes
  [key: string]: any; // Allow for arbitrary configuration keys
}

/**
 * Singleton config manager for the server
 */
class ConfigManager {
  private configPath: string;
  private config: ServerConfig = {};
  private initialized = false;

  constructor() {
    // Get user's home directory
    const homeDir = os.homedir();
    // Define config directory and file paths
    const configDir = path.join(homeDir, '.devcontrol-mcp');
    this.configPath = path.join(configDir, 'config.json');
  }

  /**
   * Initialize configuration - load from disk or create default
   */
  async init() {
    if (this.initialized) return;

    try {
      // Ensure config directory exists
      const configDir = path.dirname(this.configPath);
      if (!existsSync(configDir)) {
        await mkdir(configDir, { recursive: true });
      }

      // Check if config file exists
      try {
        await fs.access(this.configPath);
        // Load existing config
        const configData = await fs.readFile(this.configPath, 'utf8');
        this.config = JSON.parse(configData);
      } catch (error) {
        // Config file doesn't exist, create default
        this.config = this.getDefaultConfig();
        await this.saveConfig();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize config:', error);
      // Fall back to default config in memory
      this.config = this.getDefaultConfig();
      this.initialized = true;
    }
  }

  /**
   * Alias for init() to maintain backward compatibility
   */
  async loadConfig() {
    return this.init();
  }

  /**
   * Create default configuration
   */
  private getDefaultConfig(): ServerConfig {
    return {
      blockedCommands: [

        // Disk and partition management
        "mkfs",      // Create a filesystem on a device
        "format",    // Format a storage device (cross-platform)
        "mount",     // Mount a filesystem
        "umount",    // Unmount a filesystem
        "fdisk",     // Manipulate disk partition tables
        "dd",        // Convert and copy files, can write directly to disks
        "parted",    // Disk partition manipulator
        "diskpart",  // Windows disk partitioning utility
        
        // System administration and user management
        "sudo",      // Execute command as superuser
        "su",        // Substitute user identity
        "passwd",    // Change user password
        "adduser",   // Add a user to the system
        "useradd",   // Create a new user
        "usermod",   // Modify user account
        "groupadd",  // Create a new group
        "chsh",      // Change login shell
        "visudo",    // Edit the sudoers file
        
        // System control
        "shutdown",  // Shutdown the system
        "reboot",    // Restart the system
        "halt",      // Stop the system
        "poweroff",  // Power off the system
        "init",      // Change system runlevel
        
        // Network and security
        "iptables",  // Linux firewall administration
        "firewall",  // Generic firewall command
        "netsh",     // Windows network configuration
        
        // Windows system commands
        "sfc",       // System File Checker
        "bcdedit",   // Boot Configuration Data editor
        "reg",       // Windows registry editor
        "net",       // Network/user/service management
        "sc",        // Service Control manager
        "runas",     // Execute command as another user
        "cipher",    // Encrypt/decrypt files or wipe data
        "takeown"    // Take ownership of files
      ],
      defaultShell: os.platform() === 'win32' ? 'powershell.exe' : 'bash',
      allowedDirectories: [],
      claudeCliPath: undefined,
      claudeCliName: 'claude',
      fileWriteLineLimit: 50,  // Default line limit for file write operations
      fileReadLineLimit: 1000,  // Default line limit for file read operations
      maxLineCountLimit: 1000000, // Maximum line count (1 million lines)
      binaryFileSizeLimit: 10 * 1024 * 1024 // 10 MB limit for binary files
    };
  }

  /**
   * Save config to disk
   */
  private async saveConfig() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Get the entire config
   */
  async getConfig(): Promise<ServerConfig> {
    await this.init();
    return { ...this.config };
  }

  /**
   * Get a specific configuration value
   */
  async getValue(key: string): Promise<any> {
    await this.init();
    return this.config[key];
  }

  /**
   * Validate configuration values
   * @param key Configuration key
   * @param value Value to validate
   * @returns Validated and possibly corrected value
   */
  private validateConfigValue(key: string, value: any): any {
    // Validate line limits to ensure they are positive integers
    if (key === 'fileReadLineLimit' || key === 'fileWriteLineLimit' || key === 'maxLineCountLimit' || key === 'binaryFileSizeLimit') {
      // Convert to number if not already
      const numValue = Number(value);
      
      // Check if it's a positive integer
      if (isNaN(numValue) || !Number.isInteger(numValue) || numValue <= 0) {
        console.warn(`Invalid value for ${key}: ${value}. Must be a positive integer. Using default.`);
        // Return default values
        return key === 'fileReadLineLimit' ? 1000 : 50;
      }
      return numValue;
    }
    
    // Validate claudeCliPath to ensure it's absolute if provided
    if (key === 'claudeCliPath' && value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        console.warn(`Invalid value for ${key}: ${value}. Must be a string. Using default.`);
        return undefined;
      }
      if (value && !path.isAbsolute(value)) {
        console.warn(`Invalid value for ${key}: ${value}. Must be an absolute path. Using default.`);
        return undefined;
      }
    }
    
    // For all other keys, return value as-is
    return value;
  }

  /**
   * Set a specific configuration value
   */
  async setValue(key: string, value: any): Promise<void> {
    await this.init();
    const validatedValue = this.validateConfigValue(key, value);
    this.config[key] = validatedValue;
    await this.saveConfig();
  }

  /**
   * Update multiple configuration values at once
   */
  async updateConfig(updates: Partial<ServerConfig>): Promise<ServerConfig> {
    await this.init();
    
    // Validate each update value
    const validatedUpdates: Partial<ServerConfig> = {};
    for (const [key, value] of Object.entries(updates)) {
      validatedUpdates[key] = this.validateConfigValue(key, value);
    }
    
    this.config = { ...this.config, ...validatedUpdates };
    await this.saveConfig();
    return { ...this.config };
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfig(): Promise<ServerConfig> {
    this.config = this.getDefaultConfig();
    await this.saveConfig();
    return { ...this.config };
  }
}

// Export singleton instance
export const configManager = new ConfigManager();