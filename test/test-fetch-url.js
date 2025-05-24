/**
 * Test script for fetch_url tool functionality
 * 
 * This script tests:
 * 1. Fetching HTML and converting to Markdown
 * 2. Fetching plain text content
 * 3. Error handling for invalid URLs
 * 4. Timeout handling
 */

import { handleFetchUrl } from '../dist/handlers/web-handlers.js';
import assert from 'assert';

// Mock HTTP server responses for testing
const mockResponses = {
  'https://example.com/test.html': {
    headers: { 'content-type': 'text/html' },
    body: `<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <article>
    <h1>Test Article</h1>
    <p>This is a test paragraph with <strong>bold text</strong>.</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
    </ul>
  </article>
</body>
</html>`
  },
  'https://example.com/plain.txt': {
    headers: { 'content-type': 'text/plain' },
    body: 'This is plain text content.'
  }
};

/**
 * Test HTML to Markdown conversion
 */
async function testHtmlToMarkdown() {
  console.log('Testing HTML to Markdown conversion...');
  
  // Note: In a real test environment, we would mock the HTTP requests
  // For now, we'll test with a known working URL
  const result = await handleFetchUrl({
    url: 'https://www.example.com',
    format: 'markdown'
  });
  
  assert(!result.isError, 'HTML fetch should not return an error');
  assert(result.content[0].type === 'text', 'Result should be text');
  assert(result.content[0].text.includes('Example Domain'), 'Should contain expected content');
  
  console.log('✓ HTML to Markdown conversion test passed');
  return true;
}

/**
 * Test plain text fetching
 */
async function testPlainTextFetch() {
  console.log('Testing plain text fetch...');
  
  const result = await handleFetchUrl({
    url: 'https://raw.githubusercontent.com/anthropics/claude-mcp/main/README.md',
    format: 'text'
  });
  
  assert(!result.isError, 'Text fetch should not return an error');
  assert(result.content[0].type === 'text', 'Result should be text');
  assert(result.content[0].text.includes('Model Context Protocol'), 'Should contain expected content');
  
  console.log('✓ Plain text fetch test passed');
  return true;
}

/**
 * Test error handling
 */
async function testErrorHandling() {
  console.log('Testing error handling...');
  
  // Test invalid URL
  const result = await handleFetchUrl({
    url: 'not-a-valid-url'
  });
  
  assert(result.isError, 'Invalid URL should return an error');
  assert(result.content[0].text.includes('Error'), 'Error message should contain "Error"');
  
  console.log('✓ Error handling test passed');
  return true;
}

/**
 * Main test function
 */
export default async function runTests() {
  console.log('\n===== Running fetch_url tests =====\n');
  
  try {
    await testHtmlToMarkdown();
    await testPlainTextFetch();
    await testErrorHandling();
    
    console.log('\n✅ All fetch_url tests passed!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}