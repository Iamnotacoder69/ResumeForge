/**
 * Simple PDF text extraction utility as a fallback
 */

// Define the PDF output interface
export interface PDFData {
  text: string;
  numpages: number;
  info?: Record<string, any>;
  metadata?: Record<string, any>;
  version?: string;
}

/**
 * Simple PDF text extraction
 * This is a very basic implementation that attempts to extract text from PDFs
 * without requiring the pdf-parse library or its test files
 */
export async function extractPDFText(buffer: Buffer): Promise<PDFData> {
  try {
    // Convert buffer to string to attempt basic text extraction
    // This won't be perfect but might work for some basic PDFs
    const text = buffer.toString('utf-8', 0, buffer.length);
    
    // Clean up the text - remove non-printable characters
    const cleanedText = text.replace(/[^\x20-\x7E\r\n\t]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
    
    return {
      text: cleanedText,
      numpages: 1, // We can't determine pages without proper parsing
      info: {},
      metadata: {},
      version: '1.0'
    };
  } catch (error) {
    // Return empty result on error
    return {
      text: '',
      numpages: 0,
      info: {},
      metadata: {},
      version: '1.0'
    };
  }
}