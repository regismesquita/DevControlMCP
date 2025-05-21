#!/usr/bin/env node

import { fuzzySearchLogger } from '../dist/utils/fuzzySearchLogger.js';
import fs from 'fs/promises';

// Simple command-line argument parsing
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Analyze fuzzy search logs

Usage: node analyze-fuzzy-logs.js [options]

Options:
  -h, --help    Show this help message`);
  process.exit(0);
}

async function analyzeLogs() {
  try {
    const logs = await fuzzySearchLogger.getRecentLogs(1000); // Get up to 1000 recent logs
    const logPath = await fuzzySearchLogger.getLogPath();
    
    if (logs.length === 0) {
      console.log(`No fuzzy search logs found. Log file location: ${logPath}`);
      return;
    }
    
    console.log(`\nFuzzy Search Log Analysis (${logs.length} entries):\n`);
    console.log('='.repeat(60));
    
    // Initialize statistics
    const stats = {
      totalLogs: logs.length,
      belowThresholdCount: 0,
      exactMatchCount: 0,
      avgSimilarity: 0,
      avgExecutionTime: 0,
      fileExtensions: new Map(),
      similarityDistribution: {
        '0-25%': 0,
        '26-50%': 0,
        '51-75%': 0,
        '76-90%': 0,
        '91-99%': 0,
        '100%': 0
      },
      executionTimeDistribution: {
        '<1ms': 0,
        '1-10ms': 0,
        '11-50ms': 0,
        '51-100ms': 0,
        '101-500ms': 0,
        '>500ms': 0
      },
      problematicMatches: []
    };
    
    // Parse and analyze logs
    logs.forEach((log) => {
      const parts = log.split('\t');
      if (parts.length >= 16) {
        const [
          timestamp, searchText, foundText, similarity, 
          executionTime, exactMatch, expectedReplacements,
          fuzzyThreshold, belowThreshold, diff,
          searchLength, foundLength, fileExtension,
          characterCodes, uniqueCharacterCount, diffLength
        ] = parts;
        
        const simValue = parseFloat(similarity);
        const execTime = parseFloat(executionTime);
        
        // Update statistics
        stats.avgSimilarity += simValue;
        stats.avgExecutionTime += execTime;
        
        if (belowThreshold === 'true') stats.belowThresholdCount++;
        if (exactMatch === 'true') stats.exactMatchCount++;
        
        // File extension stats
        if (!stats.fileExtensions.has(fileExtension)) {
          stats.fileExtensions.set(fileExtension, 1);
        } else {
          stats.fileExtensions.set(fileExtension, stats.fileExtensions.get(fileExtension) + 1);
        }
        
        // Similarity distribution
        const simPercent = simValue * 100;
        if (simPercent === 100) stats.similarityDistribution['100%']++;
        else if (simPercent >= 91) stats.similarityDistribution['91-99%']++;
        else if (simPercent >= 76) stats.similarityDistribution['76-90%']++;
        else if (simPercent >= 51) stats.similarityDistribution['51-75%']++;
        else if (simPercent >= 26) stats.similarityDistribution['26-50%']++;
        else stats.similarityDistribution['0-25%']++;
        
        // Execution time distribution
        if (execTime < 1) stats.executionTimeDistribution['<1ms']++;
        else if (execTime <= 10) stats.executionTimeDistribution['1-10ms']++;
        else if (execTime <= 50) stats.executionTimeDistribution['11-50ms']++;
        else if (execTime <= 100) stats.executionTimeDistribution['51-100ms']++;
        else if (execTime <= 500) stats.executionTimeDistribution['101-500ms']++;
        else stats.executionTimeDistribution['>500ms']++;
        
        // Track problematic matches (below threshold or very slow)
        if (belowThreshold === 'true' || execTime > 500) {
          stats.problematicMatches.push({
            timestamp,
            similarity: simPercent.toFixed(2) + '%',
            executionTime: execTime.toFixed(2) + 'ms',
            fileExtension,
            searchLength: parseInt(searchLength),
            foundLength: parseInt(foundLength),
            belowThreshold: belowThreshold === 'true'
          });
        }
      }
    });
    
    // Calculate averages
    stats.avgSimilarity = (stats.avgSimilarity / stats.totalLogs) * 100;
    stats.avgExecutionTime = stats.avgExecutionTime / stats.totalLogs;
    
    // Sort file extensions by frequency
    const sortedExtensions = [...stats.fileExtensions.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([ext, count]) => ({ extension: ext || 'none', count, percentage: (count / stats.totalLogs * 100).toFixed(2) + '%' }));
    
    // Output analysis
    console.log(`Overall Statistics:`);
    console.log(`- Total Logs: ${stats.totalLogs}`);
    console.log(`- Average Similarity: ${stats.avgSimilarity.toFixed(2)}%`);
    console.log(`- Average Execution Time: ${stats.avgExecutionTime.toFixed(2)}ms`);
    console.log(`- Exact Matches: ${stats.exactMatchCount} (${(stats.exactMatchCount / stats.totalLogs * 100).toFixed(2)}%)`);
    console.log(`- Below Threshold Matches: ${stats.belowThresholdCount} (${(stats.belowThresholdCount / stats.totalLogs * 100).toFixed(2)}%)`);
    
    console.log(`\nFile Extension Distribution:`);
    sortedExtensions.forEach(({ extension, count, percentage }) => {
      console.log(`- ${extension}: ${count} (${percentage})`);
    });
    
    console.log(`\nSimilarity Score Distribution:`);
    Object.entries(stats.similarityDistribution).forEach(([range, count]) => {
      console.log(`- ${range}: ${count} (${(count / stats.totalLogs * 100).toFixed(2)}%)`);
    });
    
    console.log(`\nExecution Time Distribution:`);
    Object.entries(stats.executionTimeDistribution).forEach(([range, count]) => {
      console.log(`- ${range}: ${count} (${(count / stats.totalLogs * 100).toFixed(2)}%)`);
    });
    
    if (stats.problematicMatches.length > 0) {
      console.log(`\nPotentially Problematic Matches (${stats.problematicMatches.length}):`);
      stats.problematicMatches.slice(0, 10).forEach((match, index) => {
        console.log(`\n${index + 1}. ${match.timestamp}`);
        console.log(`   - Similarity: ${match.similarity}`);
        console.log(`   - Execution Time: ${match.executionTime}`);
        console.log(`   - File Extension: ${match.fileExtension}`);
        console.log(`   - Search/Found Length: ${match.searchLength}/${match.foundLength} chars`);
        console.log(`   - Below Threshold: ${match.belowThreshold}`);
      });
      
      if (stats.problematicMatches.length > 10) {
        console.log(`\n... and ${stats.problematicMatches.length - 10} more problematic matches`);
      }
    }
    
    // Provide recommendations
    console.log('\nRecommendations:');
    
    if (stats.belowThresholdCount > stats.totalLogs * 0.1) {
      console.log('- Consider lowering the similarity threshold as many matches are falling below it');
    }
    
    if (stats.executionTimeDistribution['>500ms'] > stats.totalLogs * 0.1) {
      console.log('- Many operations are taking >500ms. Consider optimizing search text or using more explicit matches');
    }
    
    if (stats.similarityDistribution['0-25%'] + stats.similarityDistribution['26-50%'] > stats.totalLogs * 0.1) {
      console.log('- Several very low similarity matches detected. Check for malformed search text patterns');
    }
    
    console.log(`\nLog file location: ${logPath}`);
  } catch (error) {
    console.error('Failed to analyze fuzzy search logs:', error.message);
    process.exit(1);
  }
}

analyzeLogs();