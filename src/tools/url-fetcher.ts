/**
 * URL fetching and content processing tool implementation
 * Handles web content retrieval, HTML to Markdown conversion, and image processing
 */

import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import sharp from 'sharp';
import { FetchUrlArgsSchema } from './schemas.js';

const IMAGE_COMPRESSION_THRESHOLD = 1024 * 1024; // 1MB
const MAX_DOWNLOAD_SIZE = 10 * 1024 * 1024; // 10MB

export async function fetchUrl(args: z.infer<typeof FetchUrlArgsSchema>): Promise<string> {
  const { url, format, offset, length, timeoutMs } = args;

  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP and HTTPS protocols are supported');
    }

    // Prepare request headers
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (compatible; DevControlMCP/1.0)'
    };

    // Add range header if offset/length specified
    if (offset !== undefined || length !== undefined) {
      const start = offset || 0;
      const end = length ? start + length - 1 : '';
      headers['Range'] = `bytes=${start}-${end}`;
    }

    // Make HTTP request
    const response = await axios.get(url, {
      headers,
      timeout: timeoutMs || 30000,
      responseType: format === 'image' ? 'arraybuffer' : 'text',
      maxContentLength: MAX_DOWNLOAD_SIZE,
      maxBodyLength: MAX_DOWNLOAD_SIZE,
    });

    const contentType = response.headers['content-type'] || '';
    const isHtml = contentType.includes('text/html');
    const isImage = contentType.startsWith('image/');

    // Handle based on format
    if (format === 'image' || (format === 'markdown' && isImage)) {
      if (!isImage) {
        throw new Error(`Expected image content but got ${contentType}`);
      }
      return await processImage(response.data, contentType);
    } else if (format === 'markdown' && isHtml) {
      return await htmlToMarkdown(response.data, url);
    } else {
      // Return as text
      return response.data;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      } else if (axiosError.response) {
        throw new Error(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
      } else if (axiosError.request) {
        throw new Error(`Network error: ${axiosError.message}`);
      }
    }
    throw error;
  }
}

async function htmlToMarkdown(html: string, baseUrl: string): Promise<string> {
  try {
    // Parse HTML with jsdom
    const dom = new JSDOM(html, { url: baseUrl });
    const document = dom.window.document;

    // Extract readable content
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      // Fallback to simple conversion if Readability fails
      const turndown = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
      });
      return turndown.turndown(html);
    }

    // Convert to markdown
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    let markdown = `# ${article.title}\n\n`;
    if (article.byline) {
      markdown += `By ${article.byline}\n\n`;
    }
    markdown += turndown.turndown(article.content || '');

    return markdown;
  } catch (error) {
    throw new Error(`Failed to convert HTML to Markdown: ${error}`);
  }
}

async function processImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    // Check if compression is needed
    if (buffer.length <= IMAGE_COMPRESSION_THRESHOLD) {
      // Return as base64
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    // Compress image
    let compressed: Buffer;
    
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      compressed = await sharp(buffer)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } else if (mimeType.includes('png')) {
      compressed = await sharp(buffer)
        .png({ compressionLevel: 9 })
        .toBuffer();
    } else if (mimeType.includes('webp')) {
      compressed = await sharp(buffer)
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // For other formats, try to convert to JPEG
      compressed = await sharp(buffer)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      mimeType = 'image/jpeg';
    }

    // Use compressed version if smaller
    const finalBuffer = compressed.length < buffer.length ? compressed : buffer;
    return `data:${mimeType};base64,${finalBuffer.toString('base64')}`;
  } catch (error) {
    // If compression fails, return original
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
}