/**
 * Test script for write tool functionality
 * 
 * This script tests:
 * 1. Put operation (write file) with overwrite and append modes
 * 2. Mkdir operation with recursive option
 * 3. Copy operation with overwrite control
 * 4. Move operation with overwrite control
 * 5. Delete operation with recursive support
 * 6. Touch operation for timestamp updates
 * 7. Batched operations with error handling
 */

import { handleWrite } from '../dist/handlers/write-handlers.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define test paths
const BASE_TEST_DIR = path.join(__dirname, 'test_write');

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
 * Test put operation
 */
async function testPutOperation() {
  console.log('Testing put operation...');
  
  // Test creating a new file
  let result = await handleWrite({
    operations: [
      { type: 'mkdir', path: BASE_TEST_DIR, recursive: true },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'test.txt'), content: 'Hello World' }
    ]
  });
  
  assert(!result.isError, 'Put operation should not fail');
  const content = await fs.readFile(path.join(BASE_TEST_DIR, 'test.txt'), 'utf-8');
  assert(content === 'Hello World', 'File content should match');
  
  // Test append mode
  result = await handleWrite({
    operations: [
      { type: 'put', path: path.join(BASE_TEST_DIR, 'test.txt'), content: '\nAppended text', mode: 'append' }
    ]
  });
  
  assert(!result.isError, 'Append operation should not fail');
  const appendedContent = await fs.readFile(path.join(BASE_TEST_DIR, 'test.txt'), 'utf-8');
  assert(appendedContent === 'Hello World\nAppended text', 'Appended content should match');
  
  // Test base64 encoding
  const base64Content = Buffer.from('Binary content').toString('base64');
  result = await handleWrite({
    operations: [
      { type: 'put', path: path.join(BASE_TEST_DIR, 'binary.bin'), content: base64Content, encoding: 'base64' }
    ]
  });
  
  assert(!result.isError, 'Base64 put operation should not fail');
  const binaryContent = await fs.readFile(path.join(BASE_TEST_DIR, 'binary.bin'), 'utf-8');
  assert(binaryContent === 'Binary content', 'Base64 decoded content should match');
  
  console.log('✓ Put operation test passed');
}

/**
 * Test mkdir operation
 */
async function testMkdirOperation() {
  console.log('Testing mkdir operation...');
  
  // Test 1: Create directory with existing parent (non-recursive)
  let result = await handleWrite({
    operations: [
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'simple_dir'), recursive: false }
    ]
  });
  
  assert(!result.isError, 'Directory creation with existing parent should succeed');
  let stats = await fs.stat(path.join(BASE_TEST_DIR, 'simple_dir'));
  assert(stats.isDirectory(), 'Should create simple directory');
  
  // Test 2: Create directory with non-existent parent (recursive)
  result = await handleWrite({
    operations: [
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'nonexistent/test_dir'), recursive: true }
    ]
  });
  
  assert(!result.isError, 'Directory creation with recursive should succeed');
  stats = await fs.stat(path.join(BASE_TEST_DIR, 'nonexistent/test_dir'));
  assert(stats.isDirectory(), 'Should create directory with non-existent parent');
  
  // Test 3: Create nested directory structure
  result = await handleWrite({
    operations: [
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'nested/deep/structure'), recursive: true }
    ]
  });
  
  assert(!result.isError, 'Nested directory creation should succeed');
  stats = await fs.stat(path.join(BASE_TEST_DIR, 'nested/deep/structure'));
  assert(stats.isDirectory(), 'Should create nested directory structure');
  
  // Test 4: Non-recursive mkdir should fail for nested paths
  const failResult = await handleWrite({
    operations: [
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'another/nested/dir'), recursive: false }
    ]
  });
  
  // Check that at least one operation failed
  const text = failResult.content[0].text;
  assert(text.includes('failed') || text.includes('error'), 'Non-recursive mkdir should fail for nested paths');
  
  console.log('✓ Mkdir operation test passed');
}

/**
 * Test copy operation
 */
async function testCopyOperation() {
  console.log('Testing copy operation...');
  
  // Create source file
  await handleWrite({
    operations: [
      { type: 'put', path: path.join(BASE_TEST_DIR, 'source.txt'), content: 'Source content' }
    ]
  });
  
  // Test copy file
  let result = await handleWrite({
    operations: [
      { type: 'copy', source: path.join(BASE_TEST_DIR, 'source.txt'), destination: path.join(BASE_TEST_DIR, 'copied.txt') }
    ]
  });
  
  assert(!result.isError, 'Copy operation should not fail');
  const copiedContent = await fs.readFile(path.join(BASE_TEST_DIR, 'copied.txt'), 'utf-8');
  assert(copiedContent === 'Source content', 'Copied content should match');
  
  // Test overwrite protection
  await handleWrite({
    operations: [
      { type: 'put', path: path.join(BASE_TEST_DIR, 'existing.txt'), content: 'Existing content' }
    ]
  });
  
  result = await handleWrite({
    operations: [
      { type: 'copy', source: path.join(BASE_TEST_DIR, 'source.txt'), destination: path.join(BASE_TEST_DIR, 'existing.txt'), overwrite: false }
    ]
  });
  
  const text = result.content[0].text;
  assert(text.includes('exists') || text.includes('failed'), 'Copy with overwrite=false should fail for existing file');
  
  console.log('✓ Copy operation test passed');
}

/**
 * Test move operation
 */
async function testMoveOperation() {
  console.log('Testing move operation...');
  
  // Create source file
  await handleWrite({
    operations: [
      { type: 'put', path: path.join(BASE_TEST_DIR, 'tomove.txt'), content: 'Move me' }
    ]
  });
  
  // Test move file
  const result = await handleWrite({
    operations: [
      { type: 'move', source: path.join(BASE_TEST_DIR, 'tomove.txt'), destination: path.join(BASE_TEST_DIR, 'moved.txt') }
    ]
  });
  
  assert(!result.isError, 'Move operation should not fail');
  
  // Check source doesn't exist
  let sourceExists = true;
  try {
    await fs.access(path.join(BASE_TEST_DIR, 'tomove.txt'));
  } catch {
    sourceExists = false;
  }
  assert(!sourceExists, 'Source file should not exist after move');
  
  // Check destination exists
  const movedContent = await fs.readFile(path.join(BASE_TEST_DIR, 'moved.txt'), 'utf-8');
  assert(movedContent === 'Move me', 'Moved content should match');
  
  console.log('✓ Move operation test passed');
}

/**
 * Test delete operation
 */
async function testDeleteOperation() {
  console.log('Testing delete operation...');
  
  // Create files and directories
  await handleWrite({
    operations: [
      { type: 'put', path: path.join(BASE_TEST_DIR, 'todelete.txt'), content: 'Delete me' },
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'deletedir/subdir'), recursive: true },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'deletedir/file.txt'), content: 'File in dir' }
    ]
  });
  
  // Test delete file
  let result = await handleWrite({
    operations: [
      { type: 'delete', path: path.join(BASE_TEST_DIR, 'todelete.txt') }
    ]
  });
  
  assert(!result.isError, 'Delete file operation should not fail');
  
  // Check file doesn't exist
  let fileExists = true;
  try {
    await fs.access(path.join(BASE_TEST_DIR, 'todelete.txt'));
  } catch {
    fileExists = false;
  }
  assert(!fileExists, 'File should not exist after delete');
  
  // Test delete non-empty directory without recursive (should fail)
  result = await handleWrite({
    operations: [
      { type: 'delete', path: path.join(BASE_TEST_DIR, 'deletedir'), recursive: false }
    ]
  });
  
  const text = result.content[0].text;
  assert(text.includes('not empty') || text.includes('failed'), 'Delete non-empty dir without recursive should fail');
  
  // Test delete with recursive
  result = await handleWrite({
    operations: [
      { type: 'delete', path: path.join(BASE_TEST_DIR, 'deletedir'), recursive: true }
    ]
  });
  
  assert(!result.isError, 'Delete with recursive should not fail');
  
  console.log('✓ Delete operation test passed');
}

/**
 * Test touch operation
 */
async function testTouchOperation() {
  console.log('Testing touch operation...');
  
  // Test creating new file with touch
  let result = await handleWrite({
    operations: [
      { type: 'touch', path: path.join(BASE_TEST_DIR, 'touched.txt') }
    ]
  });
  
  assert(!result.isError, 'Touch operation should not fail');
  const stats = await fs.stat(path.join(BASE_TEST_DIR, 'touched.txt'));
  assert(stats.isFile(), 'Touch should create file');
  
  // Test updating timestamp
  const oldTime = stats.mtime;
  await new Promise(resolve => setTimeout(resolve, 10)); // Wait a bit
  
  result = await handleWrite({
    operations: [
      { type: 'touch', path: path.join(BASE_TEST_DIR, 'touched.txt') }
    ]
  });
  
  assert(!result.isError, 'Touch update should not fail');
  const newStats = await fs.stat(path.join(BASE_TEST_DIR, 'touched.txt'));
  assert(newStats.mtime > oldTime, 'Touch should update timestamp');
  
  console.log('✓ Touch operation test passed');
}

/**
 * Test batch operations
 */
async function testBatchOperations() {
  console.log('Testing batch operations...');
  
  // Test multiple operations in one call
  const result = await handleWrite({
    operations: [
      { type: 'mkdir', path: path.join(BASE_TEST_DIR, 'batch'), recursive: true },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'batch/file1.txt'), content: 'File 1' },
      { type: 'put', path: path.join(BASE_TEST_DIR, 'batch/file2.txt'), content: 'File 2' },
      { type: 'copy', source: path.join(BASE_TEST_DIR, 'batch/file1.txt'), destination: path.join(BASE_TEST_DIR, 'batch/file1_copy.txt') },
      { type: 'move', source: path.join(BASE_TEST_DIR, 'batch/file2.txt'), destination: path.join(BASE_TEST_DIR, 'batch/file2_moved.txt') },
      { type: 'touch', path: path.join(BASE_TEST_DIR, 'batch/touched.txt') }
    ]
  });
  
  assert(!result.isError, 'Batch operations should not fail');
  const text = result.content[0].text;
  assert(text.includes('success'), 'Should report successes');
  
  // Verify all operations completed
  const files = await fs.readdir(path.join(BASE_TEST_DIR, 'batch'));
  assert(files.includes('file1.txt'), 'file1.txt should exist');
  assert(files.includes('file1_copy.txt'), 'file1_copy.txt should exist');
  assert(!files.includes('file2.txt'), 'file2.txt should not exist (moved)');
  assert(files.includes('file2_moved.txt'), 'file2_moved.txt should exist');
  assert(files.includes('touched.txt'), 'touched.txt should exist');
  
  console.log('✓ Batch operations test passed');
}

/**
 * Main test function
 */
export default async function runTests() {
  console.log('\n===== Running write tool tests =====\n');
  
  try {
    await cleanupTestDirectories();
    
    await testPutOperation();
    await testMkdirOperation();
    await testCopyOperation();
    await testMoveOperation();
    await testDeleteOperation();
    await testTouchOperation();
    await testBatchOperations();
    
    await cleanupTestDirectories();
    
    console.log('\n✅ All write tool tests passed!\n');
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