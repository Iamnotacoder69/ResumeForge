import * as fs from 'fs';
import { extractPDFText, PDFData } from './mock-pdf-parse';

// Custom function to safely parse PDFs without requiring test files
export async function parsePDF(buffer: Buffer): Promise<PDFData> {
  try {
    // Use our simplified PDF text extraction implementation
    return await extractPDFText(buffer);
  } catch (error: unknown) {
    console.error('Error parsing PDF:', error);
    // Return a minimal result with just the error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      text: `Error parsing PDF: ${errorMessage}`,
      numpages: 0,
      info: {},
      metadata: {},
      version: '1.0'
    };
  }
}