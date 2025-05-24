/**
 * Test script for find tool functionality
 * 
 * This script tests:
 * 1. Name pattern matching with glob patterns
 * 2. Content pattern matching with regex
 * 3. Metadata filtering (size, dates, type)
 * 4. Combining multiple criteria
 * 5. Recursive vs non-recursive search
 */

import { handleFind } from '../dist/handlers/find-handlers.js';
import { handleWrite } from '../dist/handlers/write-handlers.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test paths
const BASE_TEST_DIR = path.join(__dirname, 'test_find');

/**
 * Helper function to clean up test directories
 */
async function cleanupTestDirectories() {
  try {
    await fs.rm(BASE_TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    // Ignore if doesn't exist
  }
}

/**
 * Setup test file structure
 */
async function setupTestFiles() {
  await cleanupTestDirectories();
  
  // Create test file structure using the write tool
  const result = await handleWrite({
    operations: [
      { type: 'mkdir', path: BASE_TEST_DIR, recursive: true },
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'src'), recursive: true },
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'test'), recursive: true },
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'docs'), recursive: true },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'README.md'), content: '# Test Project\n\nThis is a test README file with TODO items.' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'package.json'), content: '{\n  "name": "test-project",\n  "version": "1.0.0"\n}' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'src/index.js'), content: '// Main file\nconsole.log("Hello World");\n// TODO: Add more features' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'src/utils.js'), content: 'export function helper() {\n  // FIXME: Optimize this\n  return 42;\n}' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'test/test.js'), content: 'import { helper } from "../src/utils.js";\n// TODO: Write tests' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'docs/guide.md'), content: '# User Guide\n\nWelcome to the guide.' },
      { type: 'put', path: path.join(BASE_TEST_DIR, '.gitignore'), content: 'node_modules/\n*.log' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'large_file.txt'), content: 'x'.repeat(10000) } // 10KB file
    ]
  });
  
  assert(!result.isError, 'Setup should not fail');
}

/**
 * Test name pattern matching
 */
async function testNamePattern() {
  console.log('Testing name pattern matching...');
  
  // Find all .js files
  const result = await handleFind({
    base_path: BASE_TEST_DIR,
    recursive: true,
    match_criteria: [{
      type: 'name_pattern',
      pattern: '*.js'
    }]
  });
  
  assert(!result.isError, 'Find should not return an error');
  const text = result.content[0].text;
  assert(text.includes('index.js'), 'Should find index.js');
  assert(text.includes('utils.js'), 'Should find utils.js');
  assert(text.includes('test.js'), 'Should find test.js');
  assert(!text.includes('README.md'), 'Should not find .md files');
  
  console.log('✓ Name pattern test passed');
}

/**
 * Test content pattern matching
 */
async function testContentPattern() {
  console.log('Testing content pattern matching...');
  
  // Find files containing TODO or FIXME
  const result = await handleFind({
    base_path: BASE_TEST_DIR,
    recursive: true,
    match_criteria: [{
      type: 'content_pattern',
      pattern: 'TODO|FIXME',
      is_regex: true,
      case_sensitive: false
    }]
  });
  
  assert(!result.isError, 'Find should not return an error');
  const text = result.content[0].text;
  assert(text.includes('README.md'), 'Should find README with TODO');
  assert(text.includes('index.js'), 'Should find index.js with TODO');
  assert(text.includes('utils.js'), 'Should find utils.js with FIXME');
  assert(!text.includes('package.json'), 'Should not find files without pattern');
  
  console.log('✓ Content pattern test passed');
}

/**
 * Test metadata filtering
 */
async function testMetadataFilter() {
  console.log('Testing metadata filtering...');
  
  // Find files larger than 5KB
  const result = await handleFind({
    base_path: BASE_TEST_DIR,
    recursive: true,
    match_criteria: [{
      type: 'metadata_filter',
      attribute: 'size_bytes',
      operator: '>',
      value: 5000
    }],
    entry_type_filter: 'file'
  });
  
  assert(!result.isError, 'Find should not return an error');
  const text = result.content[0].text;
  assert(text.includes('large_file.txt'), 'Should find large file');
  assert(!text.includes('README.md'), 'Should not find small files');
  
  console.log('✓ Metadata filter test passed');
}

/**
 * Test combining criteria
 */
async function testCombinedCriteria() {
  console.log('Testing combined criteria...');
  
  // Find .js files containing TODO
  const result = await handleFind({
    base_path: BASE_TEST_DIR,
    recursive: true,
    match_criteria: [
      {
        type: 'name_pattern',
        pattern: '*.js'
      },
      {
        type: 'content_pattern',
        pattern: 'TODO',
        case_sensitive: false
      }
    ]
  });
  
  assert(!result.isError, 'Find should not return an error');
  const text = result.content[0].text;
  assert(text.includes('index.js'), 'Should find index.js with TODO');
  assert(text.includes('test.js'), 'Should find test.js with TODO');
  assert(!text.includes('utils.js'), 'Should not find utils.js (no TODO)');
  assert(!text.includes('README.md'), 'Should not find non-.js files');
  
  console.log('✓ Combined criteria test passed');
}

/**
 * Test non-recursive search
 */
async function testNonRecursive() {
  console.log('Testing non-recursive search...');
  
  const result = await handleFind({
    base_path: BASE_TEST_DIR,
    recursive: false,
    match_criteria: [{
      type: 'name_pattern',
      pattern: '*'
    }]
  });
  
  assert(!result.isError, 'Find should not return an error');
  const text = result.content[0].text;
  assert(text.includes('README.md'), 'Should find root files');
  assert(text.includes('src'), 'Should find root directories');
  assert(!text.includes('index.js'), 'Should not find nested files');
  
  console.log('✓ Non-recursive search test passed');
}

/**
 * Main test function
 */
export default async function runTests() {
  console.log('\n===== Running find tool tests =====\n');
  
  try {
    await setupTestFiles();
    
    await testNamePattern();
    await testContentPattern();
    await testMetadataFilter();
    await testCombinedCriteria();
    await testNonRecursive();
    
    await cleanupTestDirectories();
    
    console.log('\n✅ All find tool tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await cleanupTestDirectories();
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}