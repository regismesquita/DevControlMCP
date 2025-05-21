import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { configManager } from '../dist/config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setup() {
  console.log('Setting up claude-code tests...');
  
  // Save original config to restore later
  const originalConfig = await configManager.getConfig();
  return originalConfig;
}

async function teardown(originalConfig) {
  console.log('Tearing down claude-code tests...');
  
  // Reset configuration to original
  await configManager.updateConfig(originalConfig);
  
  console.log('✓ Teardown: config reset');
}

// Test schema and basic imports
async function testSchemaAndImports() {
  console.log('Testing schema and imports...');
  
  try {
    // Test that schemas are properly defined
    const schemas = await import('../dist/tools/schemas.js');
    
    if (!schemas.ClaudeCodeArgsSchema) {
      throw new Error('ClaudeCodeArgsSchema not exported');
    }
    
    // Test schema validation
    const validArgs = {
      prompt: 'test prompt',
      workFolder: '/tmp',
      tools: ['Bash', 'Read']
    };
    
    const parsed = schemas.ClaudeCodeArgsSchema.parse(validArgs);
    if (parsed.prompt !== 'test prompt') {
      throw new Error('Schema validation failed');
    }
    
    console.log('✓ Schema validation test passed');
    
    // Test that main functions are importable
    const claudeCode = await import('../dist/tools/claude-code.js');
    if (typeof claudeCode.callClaudeCode !== 'function') {
      throw new Error('callClaudeCode function not exported');
    }
    
    console.log('✓ Module import test passed');
    
  } catch (error) {
    console.error('✗ Schema and imports test failed:', error.message);
    throw error;
  }
}

// Test configuration handling
async function testConfigHandling() {
  console.log('Testing configuration handling...');
  
  try {
    // Test setting valid absolute path
    const testPath = '/usr/local/bin/claude';
    await configManager.setValue('claudeCliPath', testPath);
    
    const config = await configManager.getConfig();
    if (config.claudeCliPath !== testPath) {
      throw new Error('claudeCliPath not set correctly');
    }
    
    console.log('✓ Configuration setting test passed');
    
    // Test claudeCliName configuration
    await configManager.setValue('claudeCliName', 'claude-custom');
    const updatedConfig = await configManager.getConfig();
    
    if (updatedConfig.claudeCliName !== 'claude-custom') {
      throw new Error('claudeCliName not set correctly');
    }
    
    console.log('✓ Configuration claudeCliName test passed');
    
  } catch (error) {
    console.error('✗ Configuration test failed:', error.message);
    throw error;
  }
}

// Test error handling with relative path
async function testInvalidConfig() {
  console.log('Testing invalid claudeCliPath configuration...');
  
  try {
    // Set relative path (should be rejected)
    await configManager.setValue('claudeCliPath', './relative/path/claude');
    
    const claudeCode = await import('../dist/tools/claude-code.js');
    
    // This should return an error response (not throw) because relative paths are rejected
    const result = await claudeCode.callClaudeCode('test prompt');
    
    if (!result.isError || !result.content[0].text.includes('Must be an absolute path')) {
      throw new Error('Expected error response for relative claudeCliPath. Got: ' + JSON.stringify(result));
    }
    
    console.log('✓ Invalid claudeCliPath configuration test passed');
    
  } catch (error) {
    console.error('✗ Invalid config test failed:', error.message);
    throw error;
  }
}

// Test handler function with proper validation
async function testClaudeCodeHandler() {
  console.log('Testing claude_code handler validation...');
  
  try {
    const handlers = await import('../dist/handlers/claude-code-handlers.js');
    
    // Test invalid arguments (missing required prompt)
    const invalidResult = await handlers.handleClaudeCode({
      workFolder: '/some/path'  // Missing required prompt
    });
    
    if (!invalidResult.isError || !invalidResult.content[0].text.includes('Invalid arguments')) {
      throw new Error('Expected validation error for missing prompt');
    }
    
    console.log('✓ claude_code handler validation test passed');
    
  } catch (error) {
    console.error('✗ claude_code handler test failed:', error.message);
    throw error;
  }
}

// Test that server properly registers the tool
async function testServerRegistration() {
  console.log('Testing server tool registration...');
  
  try {
    // Import server and check that it loads without errors
    const server = await import('../dist/server.js');
    
    if (!server.server) {
      throw new Error('Server not exported');
    }
    
    console.log('✓ Server registration test passed');
    
  } catch (error) {
    console.error('✗ Server registration test failed:', error.message);
    throw error;
  }
}

// Main test runner (export as default for run-all-tests.js)
export default async function runClaudeCodeTests() {
  console.log('🔧 Running claude_code tool tests...');
  
  const originalConfig = await setup();
  
  try {
    await testSchemaAndImports();
    await testConfigHandling();
    await testInvalidConfig();
    await testClaudeCodeHandler();
    await testServerRegistration();
    
    console.log('✅ All claude_code tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ claude_code tests failed:', error.message);
    console.error(error);
    return false;
    
  } finally {
    await teardown(originalConfig);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runClaudeCodeTests().catch(console.error);
}