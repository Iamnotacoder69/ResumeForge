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
    // For very large buffers, we should take a more cautious approach
    // to avoid memory issues and performance problems
    const isTooLarge = buffer.length > 10 * 1024 * 1024; // 10MB
    
    let text = '';
    
    if (isTooLarge) {
      // For large files, just sample parts of the PDF
      // Get the first 1MB
      const startSample = buffer.slice(0, 1024 * 1024).toString('utf-8');
      // Get a middle 1MB sample
      const middleOffset = Math.floor(buffer.length / 2);
      const middleSample = buffer.slice(middleOffset, middleOffset + 1024 * 1024).toString('utf-8');
      // Get the last 1MB
      const endSample = buffer.slice(-1024 * 1024).toString('utf-8');
      
      text = `${startSample}\n\n[...]\n\n${middleSample}\n\n[...]\n\n${endSample}`;
    } else {
      // For smaller files, process the entire buffer
      text = buffer.toString('utf-8', 0, buffer.length);
    }
    
    // Clean up the text - remove non-printable characters
    const cleanedText = text.replace(/[^\x20-\x7E\r\n\t]/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
    
    return {
      text: cleanedText,
      numpages: isTooLarge ? 999 : 1, // Assume large files have many pages
      info: {},
      metadata: {},
      version: '1.0'
    };
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
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