#!/usr/bin/env node

import { fuzzySearchLogger } from '../dist/utils/fuzzySearchLogger.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Simple command-line argument parsing
const args = process.argv.slice(2);
let format = 'json';
let outputPath = path.join(os.homedir(), 'fuzzy-search-export.json');

// Parse format argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--format' || args[i] === '-f') {
    format = args[i + 1]?.toLowerCase() || 'json';
    break;
  }
  if (args[i].startsWith('--format=')) {
    format = args[i].split('=')[1]?.toLowerCase() || 'json';
    break;
  }
}

// Parse output argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' || args[i] === '-o') {
    outputPath = args[i + 1] || outputPath;
    break;
  }
  if (args[i].startsWith('--output=')) {
    outputPath = args[i].split('=')[1] || outputPath;
    break;
  }
}

// Validate format
if (format !== 'json' && format !== 'csv') {
  format = 'json';
}

// Update output path based on format if not explicitly set
if (!args.some(arg => arg === '--output' || arg === '-o' || arg.startsWith('--output='))) {
  outputPath = path.join(os.homedir(), `fuzzy-search-export.${format}`);
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Export fuzzy search logs to JSON or CSV format

Usage: node export-fuzzy-logs.js [options]

Options:
  -f, --format <format>   Export format: json or csv (default: json)
  -o, --output <path>     Output file path (default: ~/fuzzy-search-export.{format})
  -h, --help              Show this help message`);
  process.exit(0);
}

async function exportLogs() {
  try {
    const logs = await fuzzySearchLogger.getRecentLogs(10000); // Export up to 10,000 logs
    const logPath = await fuzzySearchLogger.getLogPath();
    
    if (logs.length === 0) {
      console.log(`No fuzzy search logs found. Log file location: ${logPath}`);
      return;
    }
    
    console.log(`Exporting ${logs.length} fuzzy search logs in ${format.toUpperCase()} format...`);
    
    // Parse log entries
    const parsedLogs = logs.map(log => {
      const parts = log.split('\t');
      if (parts.length >= 16) {
        const [
          timestamp, searchText, foundText, similarity, 
          executionTime, exactMatchCount, expectedReplacements,
          fuzzyThreshold, belowThreshold, diff,
          searchLength, foundLength, fileExtension,
          characterCodes, uniqueCharacterCount, diffLength
        ] = parts;
        
        return {
          timestamp,
          searchText: searchText.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
          foundText: foundText.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
          similarity: parseFloat(similarity),
          executionTime: parseFloat(executionTime),
          exactMatchCount,
          expectedReplacements,
          fuzzyThreshold: parseFloat(fuzzyThreshold),
          belowThreshold: belowThreshold === 'true',
          diff: diff.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
          searchLength: parseInt(searchLength),
          foundLength: parseInt(foundLength),
          fileExtension,
          characterCodes,
          uniqueCharacterCount: parseInt(uniqueCharacterCount),
          diffLength: parseInt(diffLength)
        };
      }
      return null;
    }).filter(entry => entry !== null);
    
    // Export based on format
    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(parsedLogs, null, 2), 'utf8');
    } else {
      // CSV format
      const headers = [
        'timestamp',
        'similarity',
        'executionTime',
        'exactMatchCount',
        'expectedReplacements',
        'fuzzyThreshold',
        'belowThreshold',
        'searchLength',
        'foundLength',
        'fileExtension',
        'uniqueCharacterCount',
        'diffLength'
      ];
      
      const csvRows = [
        headers.join(','),
        ...parsedLogs.map(log => [
          log.timestamp,
          log.similarity,
          log.executionTime,
          log.exactMatchCount,
          log.expectedReplacements,
          log.fuzzyThreshold,
          log.belowThreshold,
          log.searchLength,
          log.foundLength,
          log.fileExtension,
          log.uniqueCharacterCount,
          log.diffLength
        ].join(','))
      ];
      
      await fs.writeFile(outputPath, csvRows.join('\n'), 'utf8');
    }
    
    console.log(`Successfully exported fuzzy search logs to: ${outputPath}`);
  } catch (error) {
    console.error('Failed to export fuzzy search logs:', error.message);
    process.exit(1);
  }
}

exportLogs();