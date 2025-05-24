
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { parseEditBlock, performSearchReplace } from '../dist/tools/edit.js';
import { configManager } from '../dist/config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILENAME = 'test.txt';
const TEST_FILEPATH = path.join(__dirname, TEST_FILENAME);

async function setup() {
  // Save original config to restore later
  const originalConfig = await configManager.getConfig();
  return originalConfig;
}


/**
 * Teardown function to clean up after tests
 */
async function teardown(originalConfig) {

  // Reset configuration to original
  await configManager.updateConfig(originalConfig);

  // Clean up both possible file locations
  try {
    await fs.rm(TEST_FILENAME, { force: true, recursive: true });
  } catch (e) {
    // Ignore if file doesn't exist
  }
  try {
    await fs.rm(TEST_FILEPATH, { force: true, recursive: true });
  } catch (e) {
    // Ignore if file doesn't exist
  }
  // Clean up test directories
  console.log('✓ Teardown: test directories cleaned up and config restored');
}



// Export the main test function
async function testParseEditBlock() {
    try {
        await configManager.setValue('allowedDirectories', [__dirname]);
        // Test parseEditBlock - use full path in the edit block
        const testBlock = `${TEST_FILEPATH}
<<<<<<< SEARCH
old content
=======
new content
>>>>>>> REPLACE`;

        const parsed = await parseEditBlock(testBlock);
        console.log('Parse test passed:', parsed);
        console.log('TEST_FILEPATH:', TEST_FILEPATH);

        // Create a test file at the full path
        const fs = await import('fs/promises');
        await fs.writeFile(TEST_FILEPATH, 'This is old content to replace');
        console.log('File created at:', TEST_FILEPATH);
        const initialContent = await fs.readFile(TEST_FILEPATH, 'utf8');
        console.log('Initial file content:', initialContent);

        // Test performSearchReplace using the parsed result which has the correct relative path
        const replaceResult = await performSearchReplace(parsed.filePath, parsed.searchReplace);
        console.log('Replace result:', replaceResult);

        const result = await fs.readFile(TEST_FILEPATH, 'utf8');
        console.log('File content after replacement:', result);

        if (result.includes('new content')) {
            console.log('Replace test passed!');
        } else {
            throw new Error('Replace test failed!');
        }

        // Cleanup both possible locations
        try {
            await fs.unlink(TEST_FILENAME);
        } catch (e) {
            // File might not exist at this location
        }
        try {
            await fs.unlink(TEST_FILEPATH);
        } catch (e) {
            // File might not exist at this location
        }
        console.log('All tests passed! 🎉');
        return true;
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}


// Export the main test function
export default async function runTests() {
    let originalConfig;
    try {
      originalConfig = await setup();
      const testResult = await testParseEditBlock();
      if (!testResult) {
        console.error('❌ Test failed: testParseEditBlock returned false');
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      return false;
    } finally {
      if (originalConfig) {
        await teardown(originalConfig);
      }
    }
}


// If this file is run directly (not imported), execute the test
if (import.meta.url === `file://${process.argv[1]}`) {
runTests().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
});
}
