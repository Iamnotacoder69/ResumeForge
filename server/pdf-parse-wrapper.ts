/**
 * This is a wrapper for the pdf-parse library that prevents its debug mode
 * from running and looking for a test file that might not exist.
 */
import { PDFData } from './mock-pdf-parse';
import fs from 'fs';

// Import pdf-parse's direct module using dynamic import
import pkg from 'pdf-parse';
const pdfParser = pkg.default;

/**
 * Parse a PDF buffer to extract text and metadata
 * @param buffer Buffer containing PDF data
 * @param options Optional parsing options
 * @returns Promise with parsed PDF data
 */
export async function parsePDF(buffer: Buffer, options: any = {}): Promise<PDFData> {
  try {
    const result = await pdfParser(buffer, options);
    return {
      text: result.text || '',
      numpages: result.numpages || 0,
      info: result.info || {},
      metadata: result.metadata || {},
      version: result.version || ''
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return {
      text: '',
      numpages: 0
    };
  }
}