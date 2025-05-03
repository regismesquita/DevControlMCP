import { configManager } from '../dist/config-manager.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a temporary test directory for config files
const testConfigDir = path.join(os.tmpdir(), 'devcontrol-mcp-test-' + Date.now());
const testConfigFile = path.join(testConfigDir, 'config.json');

async function testPersistentCustomizations() {
    console.log("\n=== Testing Configuration Persistence ===\n");
    console.log("Starting test...");

    try {
        // Create test directory
        await fs.mkdir(testConfigDir, { recursive: true });
        console.log(`Created test config directory: ${testConfigDir}`);

        // Save original config path
        const originalConfigPath = configManager.configPath;
        
        // Set temporary config path for testing
        configManager.configPath = testConfigFile;
        
        // Reset initialized state to force reloading
        configManager.initialized = false;
        
        try {
            // Test 1: Set and verify configuration values
            console.log("\nTest 1: Setting configuration values...");
            
            // Define test config data
            const testBlockedCommands = ["test-command1", "test-command2"];
            const testAllowedDirs = ["/test/dir1", "/test/dir2"];
            
            // Set values in config
            await configManager.setValue('blockedCommands', testBlockedCommands);
            await configManager.setValue('allowedDirectories', testAllowedDirs);
            
            // Get and verify the values
            const config1 = await configManager.getConfig();
            assert.deepStrictEqual(config1.blockedCommands, testBlockedCommands, 
                "blockedCommands should match set values");
            assert.deepStrictEqual(config1.allowedDirectories, testAllowedDirs, 
                "allowedDirectories should match set values");
            
            console.log("✓ Configuration values set and verified correctly");
            
            // Test 2: Check that values were saved to disk
            console.log("\nTest 2: Verifying values were saved to disk...");
            
            // Read the config file directly
            const rawConfig = await fs.readFile(testConfigFile, 'utf8');
            const fileConfig = JSON.parse(rawConfig);
            
            assert.deepStrictEqual(fileConfig.blockedCommands, testBlockedCommands, 
                "blockedCommands should be saved to file");
            assert.deepStrictEqual(fileConfig.allowedDirectories, testAllowedDirs, 
                "allowedDirectories should be saved to file");
            
            console.log("✓ Configuration correctly saved to disk");
            
            // Test 3: Simulate process restart by reinitializing the config manager
            console.log("\nTest 3: Simulating process restart...");
            
            // Reset the in-memory config
            configManager.config = {};
            configManager.initialized = false;
            
            // Reload the config from disk
            await configManager.init();
            
            // Verify config values persisted
            const config2 = await configManager.getConfig();
            assert.deepStrictEqual(config2.blockedCommands, testBlockedCommands, 
                "blockedCommands should persist after restart");
            assert.deepStrictEqual(config2.allowedDirectories, testAllowedDirs, 
                "allowedDirectories should persist after restart");
            
            console.log("✓ Configuration correctly persisted after simulated restart");

            console.log("\n✅ All persistence tests passed!");
            return true;
        } finally {
            // Restore original config path
            configManager.configPath = originalConfigPath;
            configManager.initialized = false;
            
            // Force reload original config
            await configManager.init();
        }
    } catch (error) {
        console.error("\n❌ Tests failed:", error);
        return false;
    } finally {
        // Cleanup test directory
        try {
            await fs.rm(testConfigDir, { recursive: true, force: true });
            console.log(`Cleaned up test config directory: ${testConfigDir}`);
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
    }
}

export default testPersistentCustomizations;

// Run the test directly when executed as a script
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    console.log("Running test directly...");
    testPersistentCustomizations()
        .then(result => {
            console.log(`Test ${result ? 'passed' : 'failed'}`);
            process.exit(result ? 0 : 1);
        })
        .catch(err => {
            console.error("Unhandled error:", err);
            process.exit(1);
        });
}