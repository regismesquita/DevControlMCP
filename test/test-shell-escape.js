#!/usr/bin/env node

/**
 * Unit tests for shell escape utilities
 */

import { escapeShellArg, escapeShellArgs, buildShellCommand } from '../dist/utils/shell-escape.js';

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, expected, actual) {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${testName}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${testName}`);
    console.log(`  Expected: ${expected}`);
    console.log(`  Actual:   ${actual}`);
    failedTests++;
  }
}

function testEscapeShellArg() {
  console.log('\n🧪 Testing escapeShellArg()');
  console.log('========================');

  // Test cases
  const tests = [
    // No escaping needed
    { input: 'simple', expected: 'simple', desc: 'Simple argument without special chars' },
    { input: 'hello-world', expected: 'hello-world', desc: 'Argument with hyphen' },
    { input: 'test123', expected: 'test123', desc: 'Alphanumeric argument' },
    { input: '/path/to/file', expected: '/path/to/file', desc: 'Path without spaces' },
    
    // Whitespace
    { input: 'hello world', expected: '"hello world"', desc: 'Argument with space' },
    { input: 'hello\tworld', expected: '"hello\tworld"', desc: 'Argument with tab' },
    { input: 'hello\nworld', expected: '"hello\nworld"', desc: 'Argument with newline' },
    
    // Quotes
    { input: 'say "hello"', expected: '"say \\"hello\\""', desc: 'Double quotes' },
    { input: "it's fine", expected: '"it\'s fine"', desc: 'Single quote' },
    { input: 'mixed "quotes\' here', expected: '"mixed \\"quotes\' here"', desc: 'Mixed quotes' },
    
    // Shell variables and substitution
    { input: '$HOME', expected: '"\\$HOME"', desc: 'Dollar sign (variable)' },
    { input: '${USER}', expected: '"\\${USER}"', desc: 'Variable with braces' },
    { input: '`date`', expected: '"\\`date\\`"', desc: 'Backticks (command substitution)' },
    { input: '$(whoami)', expected: '"\\$(whoami)"', desc: 'Command substitution' },
    
    // Special shell characters
    { input: 'test\\path', expected: '"test\\\\path"', desc: 'Backslash' },
    { input: 'test!', expected: '"test!"', desc: 'Exclamation mark' },
    { input: 'test*', expected: '"test*"', desc: 'Asterisk (glob)' },
    { input: 'test?', expected: '"test?"', desc: 'Question mark (glob)' },
    { input: '#comment', expected: '"#comment"', desc: 'Hash (comment)' },
    
    // Command separators and pipes
    { input: 'cmd1; cmd2', expected: '"cmd1; cmd2"', desc: 'Semicolon' },
    { input: 'cmd1 & cmd2', expected: '"cmd1 & cmd2"', desc: 'Ampersand' },
    { input: 'cmd1 | cmd2', expected: '"cmd1 | cmd2"', desc: 'Pipe' },
    
    // Redirects
    { input: 'test > output', expected: '"test > output"', desc: 'Output redirect' },
    { input: 'test < input', expected: '"test < input"', desc: 'Input redirect' },
    
    // Grouping characters
    { input: 'func()', expected: '"func()"', desc: 'Parentheses' },
    { input: 'array[0]', expected: '"array[0]"', desc: 'Square brackets' },
    { input: 'obj{key}', expected: '"obj{key}"', desc: 'Curly braces' },
    
    // Complex cases
    { input: 'echo "$HOME" > /tmp/test.txt', expected: '"echo \\"\\$HOME\\" > /tmp/test.txt"', desc: 'Complex command' },
    { input: '`echo $USER`; rm -rf /', expected: '"\\`echo \\$USER\\`; rm -rf /"', desc: 'Injection attempt' },
    { input: 'C:\\Users\\Name\\Documents', expected: '"C:\\\\Users\\\\Name\\\\Documents"', desc: 'Windows path' },
  ];

  tests.forEach(test => {
    const result = escapeShellArg(test.input);
    assert(result === test.expected, test.desc, test.expected, result);
  });
}

function testEscapeShellArgs() {
  console.log('\n🧪 Testing escapeShellArgs()');
  console.log('=========================');

  const input = ['simple', 'with space', '$VAR', 'quote"test'];
  const expected = ['simple', '"with space"', '"\\$VAR"', '"quote\\"test"'];
  const result = escapeShellArgs(input);
  
  assert(
    JSON.stringify(result) === JSON.stringify(expected),
    'Array of mixed arguments',
    JSON.stringify(expected),
    JSON.stringify(result)
  );
}

function testBuildShellCommand() {
  console.log('\n🧪 Testing buildShellCommand()');
  console.log('===========================');

  // Test without working directory
  let result = buildShellCommand('/usr/bin/echo', ['hello', 'world']);
  let expected = '/usr/bin/echo hello world';
  assert(result === expected, 'Simple command', expected, result);

  // Test with special characters
  result = buildShellCommand('/path with spaces/exe', ['arg1', 'arg with $VAR']);
  expected = '"/path with spaces/exe" arg1 "arg with \\$VAR"';
  assert(result === expected, 'Command with spaces and variables', expected, result);

  // Test with working directory
  result = buildShellCommand('claude', ['-p', 'test prompt'], { workingDirectory: '/tmp/test dir' });
  expected = 'cd "/tmp/test dir" && claude -p "test prompt"';
  assert(result === expected, 'Command with working directory', expected, result);

  // Test complex scenario
  result = buildShellCommand(
    '/opt/claude cli/bin/claude',
    ['--prompt', 'Create function `test()` that prints "$HOME"'],
    { workingDirectory: '/Users/John Doe/Projects' }
  );
  expected = 'cd "/Users/John Doe/Projects" && "/opt/claude cli/bin/claude" --prompt "Create function \\`test()\\` that prints \\"\\$HOME\\""';
  assert(result === expected, 'Complex command with all features', expected, result);
}

// Main test function for integration with test runner
async function runTests() {
  console.log('🚀 Shell Escape Utility Test Suite');
  console.log('==================================');

  testEscapeShellArg();
  testEscapeShellArgs();
  testBuildShellCommand();

  // Summary
  console.log('\n📊 Test Summary');
  console.log('=============');
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  if (failedTests > 0) {
    console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
    return false;
  } else {
    console.log(`${colors.green}All tests passed! 🎉${colors.reset}`);
    return true;
  }
}

// Export for test runner
export default runTests;

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}