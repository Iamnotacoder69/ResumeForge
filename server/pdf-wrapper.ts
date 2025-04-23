import * as fs from 'fs';

// Define the PDF output interface to match what we need
export interface PDFData {
  text: string;
  numpages: number;
  info?: Record<string, any>;
  metadata?: Record<string, any>;
  version?: string;
  sections?: Record<string, string>;
}

// Custom function to safely parse PDFs without requiring test files
export async function parsePDF(buffer: Buffer): Promise<PDFData> {
  try {
    // Let's use a dynamic import to avoid the test file issue at startup time
    const pdfParse = (await import('pdf-parse')).default;
    return await pdfParse(buffer);
  } catch (error: unknown) {
    console.error('Error parsing PDF:', error);
    // Return a minimal result with just the error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      text: `Error parsing PDF: ${errorMessage}`,
      numpages: 0,
    };
  }
}