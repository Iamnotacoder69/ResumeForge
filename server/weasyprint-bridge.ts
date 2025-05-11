/**
 * WeasyPrint Bridge for Node.js
 * This module provides a bridge between Node.js and the Python WeasyPrint library
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get current file's directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WeasyPrintOptions {
  html: string;
  css?: string;
  outputPath?: string;
  filename?: string;
}

interface WeasyPrintResponse {
  success: boolean;
  pdf_base64?: string;
  file_path?: string;
  error?: string;
}

/**
 * Generate a PDF from HTML using WeasyPrint
 * @param options Options for PDF generation
 * @returns Promise with the PDF response
 */
export async function generatePDF(options: WeasyPrintOptions): Promise<WeasyPrintResponse> {
  return new Promise((resolve, reject) => {
    // Set default output path if filename is provided but not outputPath
    let outputPath = options.outputPath;
    if (options.filename && !outputPath) {
      const tempDir = os.tmpdir();
      outputPath = path.join(tempDir, `${options.filename}`);
    }

    // Prepare input for the Python script
    const input = JSON.stringify({
      html: options.html,
      css: options.css,
      output_path: outputPath
    });

    // Spawn Python process
    const python = spawn('python3', [path.resolve(__dirname, 'pdf_generator.py')]);
    
    let outputData = '';
    let errorData = '';

    // Collect output from Python script
    python.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PDF generation failed with code ${code}: ${errorData}`));
        return;
      }

      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python script output: ${error}`));
      }
    });

    // Send input to Python script
    python.stdin.write(input);
    python.stdin.end();
  });
}

/**
 * Generate PDF from HTML and return as base64 string
 * @param html HTML content
 * @param css Optional CSS content
 * @returns Promise with base64 encoded PDF
 */
export async function generatePDFBase64(html: string, css?: string): Promise<string> {
  const result = await generatePDF({ html, css });
  
  if (!result.success || !result.pdf_base64) {
    throw new Error(result.error || 'Unknown error generating PDF');
  }
  
  return result.pdf_base64;
}

/**
 * Generate PDF from HTML and save to file
 * @param html HTML content
 * @param outputPath Path to save the PDF
 * @param css Optional CSS content
 * @returns Promise with the file path
 */
export async function generatePDFFile(html: string, outputPath: string, css?: string): Promise<string> {
  const result = await generatePDF({ html, css, outputPath });
  
  if (!result.success || !result.file_path) {
    throw new Error(result.error || 'Unknown error generating PDF');
  }
  
  return result.file_path;
}

/**
 * Create a temporary file name for the PDF
 * @param prefix Optional file name prefix (default: 'cv-')
 * @returns Temporary file path
 */
export function createTempPDFPath(prefix = 'cv-'): string {
  const tempDir = os.tmpdir();
  const randomId = crypto.randomBytes(8).toString('hex');
  return path.join(tempDir, `${prefix}${randomId}.pdf`);
}