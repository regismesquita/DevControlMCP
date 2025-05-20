#!/usr/bin/env node

import { fuzzySearchLogger } from '../dist/utils/fuzzySearchLogger.js';
import readline from 'readline';

// Simple command-line argument parsing
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Clear fuzzy search logs

Usage: node clear-fuzzy-logs.js [options]

Options:
  -f, --force   Clear logs without confirmation prompt
  -h, --help    Show this help message`);
  process.exit(0);
}

async function clearLogs() {
  try {
    const logPath = await fuzzySearchLogger.getLogPath();
    
    if (!force) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question(`Are you sure you want to clear all fuzzy search logs at ${logPath}? [y/N] `, (answer) => {
          resolve(answer.toLowerCase());
          rl.close();
        });
      });
      
      if (answer !== 'y' && answer !== 'yes') {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    await fuzzySearchLogger.clearLog();
    console.log(`Fuzzy search logs have been cleared at ${logPath}`);
  } catch (error) {
    console.error('Failed to clear fuzzy search logs:', error.message);
    process.exit(1);
  }
}

clearLogs();