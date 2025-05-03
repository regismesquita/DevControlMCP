import assert from 'assert';
import {
  extractPlaceholders,
  createInputSchema,
  createMessageGenerator,
  promptManager
} from '../dist/prompt-manager.js';

console.log('=== Testing PromptManager ===');

// Save the original environment variables
const originalEnv = { ...process.env };

// Test extractPlaceholders
function testExtractPlaceholders() {
  console.log('\nTesting extractPlaceholders:');
  
  // Test 1: Extract placeholders from message strings
  const messageArray1 = [
    'Hello {name}!',
    'Please review this {language} code:',
    '{code}',
    'Thanks for your help.'
  ];
  
  const placeholders1 = extractPlaceholders(messageArray1);
  
  assert(placeholders1 instanceof Set, 'placeholders should be a Set');
  assert(placeholders1.size === 3, 'should have 3 placeholders');
  assert(placeholders1.has('name'), 'should have "name" placeholder');
  assert(placeholders1.has('language'), 'should have "language" placeholder');
  assert(placeholders1.has('code'), 'should have "code" placeholder');
  console.log('✓ Test 1 passed: Extract placeholders from message strings');
  
  // Test 2: Handle messages with no placeholders
  const messageArray2 = ['Hello!', 'How are you today?'];
  const placeholders2 = extractPlaceholders(messageArray2);
  
  assert(placeholders2 instanceof Set, 'placeholders should be a Set');
  assert(placeholders2.size === 0, 'should have 0 placeholders');
  console.log('✓ Test 2 passed: Handle messages with no placeholders');
  
  // Test 3: Handle multiple instances of the same placeholder
  const messageArray3 = [
    'Hello {name}!',
    'Nice to meet you, {name}.',
    'Your name is {name}.'
  ];
  
  const placeholders3 = extractPlaceholders(messageArray3);
  
  assert(placeholders3 instanceof Set, 'placeholders should be a Set');
  assert(placeholders3.size === 1, 'should have 1 placeholder');
  assert(placeholders3.has('name'), 'should have "name" placeholder');
  console.log('✓ Test 3 passed: Handle multiple instances of the same placeholder');
}

// Test createInputSchema
function testCreateInputSchema() {
  console.log('\nTesting createInputSchema:');
  
  // Test 1: Create a JSON schema from input definitions
  const inputs1 = {
    name: 'string',
    language: 'string',
    code: 'string'
  };
  
  const schema1 = createInputSchema(inputs1);
  
  assert(typeof schema1 === 'object', 'schema should be an object');
  assert(schema1.type === 'object', 'schema type should be "object"');
  assert(typeof schema1.properties === 'object', 'schema properties should be an object');
  assert(schema1.properties.name.type === 'string', 'name property type should be "string"');
  assert(schema1.properties.language.type === 'string', 'language property type should be "string"');
  assert(schema1.properties.code.type === 'string', 'code property type should be "string"');
  assert(Array.isArray(schema1.required), 'required should be an array');
  assert(schema1.required.includes('name'), 'required should include "name"');
  assert(schema1.required.includes('language'), 'required should include "language"');
  assert(schema1.required.includes('code'), 'required should include "code"');
  console.log('✓ Test 1 passed: Create a JSON schema from input definitions');
  
  // Test 2: Handle empty inputs
  const inputs2 = {};
  const schema2 = createInputSchema(inputs2);
  
  assert(typeof schema2 === 'object', 'schema should be an object');
  assert(schema2.type === 'object', 'schema type should be "object"');
  assert(typeof schema2.properties === 'object', 'schema properties should be an object');
  assert(Object.keys(schema2.properties).length === 0, 'properties should be empty');
  assert(Array.isArray(schema2.required), 'required should be an array');
  assert(schema2.required.length === 0, 'required should be empty');
  console.log('✓ Test 2 passed: Handle empty inputs');
}

// Test createMessageGenerator
function testCreateMessageGenerator() {
  console.log('\nTesting createMessageGenerator:');
  
  // Test 1: Generate MCP messages with interpolated values
  const messageTemplate1 = [
    'Hello {name}!',
    'Please review this {language} code:',
    '{code}'
  ];
  
  const generator1 = createMessageGenerator(messageTemplate1);
  
  assert(typeof generator1 === 'function', 'generator should be a function');
  
  const args1 = {
    name: 'John',
    language: 'JavaScript',
    code: 'console.log("Hello, world!");'
  };
  
  const messages1 = generator1(args1);
  
  assert(Array.isArray(messages1), 'messages should be an array');
  assert(messages1.length === 1, 'messages should have 1 item');
  assert(messages1[0].role === 'user', 'message role should be "user"');
  assert(messages1[0].content.type === 'text', 'message content type should be "text"');
  assert(messages1[0].content.text.includes('Hello John!'), 'message should include "Hello John!"');
  assert(messages1[0].content.text.includes('Please review this JavaScript code:'), 'message should include language');
  assert(messages1[0].content.text.includes('console.log("Hello, world!");'), 'message should include code');
  console.log('✓ Test 1 passed: Generate MCP messages with interpolated values');
  
  // Test 2: Leave placeholders unchanged if not provided in args
  const messageTemplate2 = [
    'Hello {name}!',
    'Please review this {language} code:',
    '{code}'
  ];
  
  const generator2 = createMessageGenerator(messageTemplate2);
  const args2 = { name: 'John' };
  const messages2 = generator2(args2);
  
  assert(messages2[0].content.text.includes('Hello John!'), 'message should include "Hello John!"');
  assert(messages2[0].content.text.includes('Please review this {language} code:'), 'message should keep {language} placeholder');
  assert(messages2[0].content.text.includes('{code}'), 'message should keep {code} placeholder');
  console.log('✓ Test 2 passed: Leave placeholders unchanged if not provided in args');
}

// Test promptManager.extractAndPreparePrompts
function testPromptManagerExtractAndPreparePrompts() {
  console.log('\nTesting promptManager.extractAndPreparePrompts:');
  
  // Clean up environment variables before each test
  process.env = { ...originalEnv };
  
  // Test 1: Extract and prepare valid prompt definitions from environment variables
  process.env.MCP_PROMPT_DEF_test_prompt = JSON.stringify({
    inputs: { name: 'string', language: 'string', code: 'string' },
    message: [
      'Hello {name}!',
      'Please review this {language} code:',
      '{code}'
    ],
    description: 'A test prompt for code review'
  });
  
  const prompts1 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts1 === 'object', 'prompts should be an object');
  assert('test_prompt' in prompts1, 'prompts should have test_prompt');
  assert(prompts1.test_prompt.name === 'test_prompt', 'prompt name should be "test_prompt"');
  assert(prompts1.test_prompt.description === 'A test prompt for code review', 'prompt description should match');
  assert(typeof prompts1.test_prompt.inputSchema === 'object', 'prompt inputSchema should be an object');
  assert(typeof prompts1.test_prompt.messageGenerator === 'function', 'prompt messageGenerator should be a function');
  console.log('✓ Test 1 passed: Extract and prepare valid prompt definitions from environment variables');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 2: Process custom prompts defined with single quotes
  process.env.MCP_PROMPT_DEF_single_quote_prompt = '{"inputs":{"name":"string"},"message":["Hello {name}!"],"description":"A prompt defined with single quotes"}';
  
  const prompts2 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts2 === 'object', 'prompts should be an object');
  assert('single_quote_prompt' in prompts2, 'prompts should have single_quote_prompt');
  assert(prompts2.single_quote_prompt.name === 'single_quote_prompt', 'prompt name should be "single_quote_prompt"');
  assert(prompts2.single_quote_prompt.description === 'A prompt defined with single quotes', 'prompt description should match');
  assert(typeof prompts2.single_quote_prompt.inputSchema === 'object', 'prompt inputSchema should be an object');
  assert(typeof prompts2.single_quote_prompt.messageGenerator === 'function', 'prompt messageGenerator should be a function');
  
  // Test the generated message
  const message2 = prompts2.single_quote_prompt.messageGenerator({ name: 'Test' });
  assert(message2[0].content.text === 'Hello Test!', 'generated message should be "Hello Test!"');
  console.log('✓ Test 2 passed: Process custom prompts defined with single quotes');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 3: Process complex prompts defined with single quotes containing nested double quotes
  process.env.MCP_PROMPT_DEF_complex_prompt = '{"inputs":{"language":"string","code":"string"},"message":["Please review this {language} code:","```{language}","{code}","```","Check for bugs, performance issues, and suggest \\"best practices\\"."],"description":"A complex prompt with nested quotes"}';
  
  const prompts3 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts3 === 'object', 'prompts should be an object');
  assert('complex_prompt' in prompts3, 'prompts should have complex_prompt');
  assert(prompts3.complex_prompt.name === 'complex_prompt', 'prompt name should be "complex_prompt"');
  assert(prompts3.complex_prompt.description === 'A complex prompt with nested quotes', 'prompt description should match');
  
  // Test the generated message with complex inputs
  const message3 = prompts3.complex_prompt.messageGenerator({
    language: 'javascript',
    code: 'function test() { console.log("Hello, world!"); }'
  });
  
  // Verify the complete message content
  assert(message3[0].content.text.includes('Please review this javascript code:'), 'message should include language intro');
  assert(message3[0].content.text.includes('```javascript'), 'message should include language code block');
  assert(message3[0].content.text.includes('function test() { console.log("Hello, world!"); }'), 'message should include code');
  assert(message3[0].content.text.includes('Check for bugs, performance issues, and suggest "best practices".'), 'message should include nested quotes');
  console.log('✓ Test 3 passed: Process complex prompts with nested quotes');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 4: Handle environment variables with actual single quotes
  // This simulates how it would be set in a real environment variable:
  // MCP_PROMPT_DEF_actual_single_quotes='{"inputs":{"name":"string"},"message":["Hello {name}!"],"description":"Using actual single quotes"}'
  process.env.MCP_PROMPT_DEF_actual_single_quotes = "'" + JSON.stringify({
    inputs: { name: 'string' },
    message: ['Hello {name}!'],
    description: 'Using actual single quotes'
  }) + "'";
  
  const prompts4 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts4 === 'object', 'prompts should be an object');
  assert('actual_single_quotes' in prompts4, 'prompts should have actual_single_quotes');
  assert(prompts4.actual_single_quotes.name === 'actual_single_quotes', 'prompt name should be "actual_single_quotes"');
  assert(prompts4.actual_single_quotes.description === 'Using actual single quotes', 'prompt description should match');
  
  // Test the generated message
  const message4 = prompts4.actual_single_quotes.messageGenerator({ name: 'Claude' });
  assert(message4[0].content.text === 'Hello Claude!', 'generated message should be "Hello Claude!"');
  console.log('✓ Test 4 passed: Handle environment variables with actual single quotes');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 5: Skip invalid JSON in environment variables
  process.env.MCP_PROMPT_DEF_valid_prompt = JSON.stringify({
    inputs: { name: 'string' },
    message: ['Hello {name}!'],
    description: 'A valid prompt'
  });
  
  process.env.MCP_PROMPT_DEF_invalid_prompt = 'This is not valid JSON';
  
  const prompts5 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts5 === 'object', 'prompts should be an object');
  assert('valid_prompt' in prompts5, 'prompts should have valid_prompt');
  assert(!('invalid_prompt' in prompts5), 'prompts should not have invalid_prompt');
  console.log('✓ Test 5 passed: Skip invalid JSON in environment variables');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 6: Validate prompt structure and skip invalid ones
  process.env.MCP_PROMPT_DEF_missing_message = JSON.stringify({
    inputs: { name: 'string' },
    description: 'A prompt missing the message field'
  });
  
  process.env.MCP_PROMPT_DEF_missing_inputs = JSON.stringify({
    message: ['Hello {name}!'],
    description: 'A prompt missing the inputs field'
  });
  
  process.env.MCP_PROMPT_DEF_valid_prompt = JSON.stringify({
    inputs: { name: 'string' },
    message: ['Hello {name}!'],
    description: 'A valid prompt'
  });
  
  const prompts6 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts6 === 'object', 'prompts should be an object');
  assert('valid_prompt' in prompts6, 'prompts should have valid_prompt');
  assert(!('missing_message' in prompts6), 'prompts should not have missing_message');
  assert(!('missing_inputs' in prompts6), 'prompts should not have missing_inputs');
  console.log('✓ Test 6 passed: Validate prompt structure and skip invalid ones');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 7: Validate that placeholders are defined in inputs
  process.env.MCP_PROMPT_DEF_undefined_placeholder = JSON.stringify({
    inputs: { name: 'string' },
    message: ['Hello {name}!', 'Your age is {age}.'],
    description: 'A prompt with an undefined placeholder'
  });
  
  process.env.MCP_PROMPT_DEF_valid_prompt = JSON.stringify({
    inputs: { name: 'string', age: 'string' },
    message: ['Hello {name}!', 'Your age is {age}.'],
    description: 'A valid prompt'
  });
  
  const prompts7 = promptManager.extractAndPreparePrompts();
  
  assert(typeof prompts7 === 'object', 'prompts should be an object');
  assert('valid_prompt' in prompts7, 'prompts should have valid_prompt');
  assert(!('undefined_placeholder' in prompts7), 'prompts should not have undefined_placeholder');
  console.log('✓ Test 7 passed: Validate that placeholders are defined in inputs');
}

// Test promptManager.getPrompt
function testPromptManagerGetPrompt() {
  console.log('\nTesting promptManager.getPrompt:');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 1: Return a registered prompt by name
  process.env.MCP_PROMPT_DEF_test_prompt = JSON.stringify({
    inputs: { name: 'string' },
    message: ['Hello {name}!'],
    description: 'A test prompt'
  });
  
  // Extract prompts
  promptManager.extractAndPreparePrompts();
  
  // Get prompt
  const prompt1 = promptManager.getPrompt('test_prompt');
  
  assert(typeof prompt1 === 'object', 'prompt should be an object');
  assert(prompt1.name === 'test_prompt', 'prompt name should be "test_prompt"');
  assert(prompt1.description === 'A test prompt', 'prompt description should match');
  console.log('✓ Test 1 passed: Return a registered prompt by name');
  
  // Clean up environment variables
  process.env = { ...originalEnv };
  
  // Test 2: Return undefined for non-existent prompts
  // Extract prompts (with no environment variables set)
  promptManager.extractAndPreparePrompts();
  
  // Get non-existent prompt
  const prompt2 = promptManager.getPrompt('non_existent');
  
  assert(prompt2 === undefined, 'prompt should be undefined');
  console.log('✓ Test 2 passed: Return undefined for non-existent prompts');
}

// Run all tests
try {
  testExtractPlaceholders();
  testCreateInputSchema();
  testCreateMessageGenerator();
  testPromptManagerExtractAndPreparePrompts();
  testPromptManagerGetPrompt();
  
  console.log('\n✅ All tests passed!');
  process.exit(0);
} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
} finally {
  // Reset environment variables
  process.env = { ...originalEnv };
}
