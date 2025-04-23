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
    let cleanedText = text.replace(/[^\x20-\x7E\r\n\t]/g, ' ')
                          .replace(/\s{2,}/g, ' ')
                          .trim();
                         
    // Try to identify and split lines properly (PDF extraction often combines lines)
    // Look for patterns like capital letters after periods, capital first letters of lines,
    // and bullet points
    
    // First convert multiple line breaks to a standard format
    cleanedText = cleanedText.replace(/\r\n/g, '\n')
                            .replace(/\r/g, '\n')
                            .replace(/\n{3,}/g, '\n\n');
    
    // Then improve text parsing with additional formatting
    cleanedText = cleanedText
      // Create line breaks before bullet points
      .replace(/([.!?]) ([•\-\*])/g, '$1\n$2')
      // Create line breaks before dates in common formats (e.g., MM/YYYY, YYYY-YYYY)
      .replace(/([.!?]) (\d{1,2}\/\d{4}|\d{4}-\d{4})/g, '$1\n$2')
      // Create line breaks before uppercase-started sentences, being cautious of abbreviations
      .replace(/([.!?]) ([A-Z][a-z])/g, '$1\n$2')
      // Create line breaks after colons that are part of section headers
      .replace(/([A-Za-z]+):\s+/g, '$1:\n')
      // Ensure there's a line break after ALL CAPS text (common for headers)
      .replace(/([A-Z]{2,}[A-Z ]{3,})\s+([a-z])/g, '$1\n$2');
    
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