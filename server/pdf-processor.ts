import * as fs from 'fs';
import * as path from 'path';
import { extractPDFText } from './mock-pdf-parse';
import * as mammoth from 'mammoth';

/**
 * A simple PDF processor that:
 * 1. Extracts text from PDF using our custom extractor 
 * 2. Handles truncation for large documents
 */
export async function processPDF(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Extract text using our custom PDF extractor
    const pdfData = await extractPDFText(dataBuffer);
    console.log(`Raw extracted PDF text length: ${pdfData.text.length}`);
    
    // Apply truncation for very large documents
    let processedText = pdfData.text;
    
    // Truncate if needed (OpenAI has token limits)
    const maxTextLength = 30000;
    if (processedText.length > maxTextLength) {
      console.log(`PDF text too long (${processedText.length} chars), truncating to ${maxTextLength} chars`);
      // Keep first 10,000 chars (usually contains the most important info)
      const firstPart = processedText.substring(0, 10000);
      // Keep last 5,000 chars (might contain conclusion or important ending sections)
      const lastPart = processedText.substring(processedText.length - 5000);
      // Take 15,000 chars from the middle (to capture work experience, etc.)
      const middleStart = Math.floor((processedText.length - 15000) / 2);
      const middlePart = processedText.substring(middleStart, middleStart + 15000);
      
      processedText = `${firstPart}\n\n[...text truncated due to length...]\n\n${middlePart}\n\n[...text truncated due to length...]\n\n${lastPart}`;
      console.log(`Truncated PDF text length: ${processedText.length}`);
    }
    
    return processedText;
  } catch (error) {
    console.error('Error processing PDF:', error);
    throw new Error('Failed to process PDF document');
  }
}

/**
 * Process a document as if it were a Word file
 * For PDF files, this will extract the text and then process it
 * For Word files, it will directly extract the text
 */
export async function processDocument(filePath: string, fileType: string): Promise<string> {
  try {
    // For Word documents, use mammoth
    if (fileType.includes("wordprocessingml") || fileType.includes("msword")) {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({buffer: dataBuffer});
      
      console.log(`Extracted Word text length: ${result.value.length}`);
      return result.value;
    }
    
    // For PDFs, use our custom extractor
    if (fileType === "application/pdf") {
      return await processPDF(filePath);
    }
    
    // For unknown types, return empty string
    return "";
  } catch (error) {
    console.error('Error processing document:', error);
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : String(error)}`);
  }
}