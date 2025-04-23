import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import mammoth from 'mammoth';
import { extractTextFromPDF } from './pdf-extractor';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

/**
 * Extract text from a PDF file using our specialized PDF extractor
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
async function convertPdfToText(filePath: string): Promise<string> {
  try {
    console.log(`Processing PDF file: ${filePath}`);
    
    // Use our specialized PDF extractor that tries multiple methods
    const pdfText = await extractTextFromPDF(filePath);
    
    if (!pdfText || pdfText.trim().length < 50) {
      console.warn("WARNING: Extracted PDF text is very short or empty");
      throw new Error("The extracted PDF text was too short to be a valid CV");
    }
    
    console.log(`Successfully extracted text from PDF, length: ${pdfText.length} characters`);
    return pdfText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a DOCX file to plain text
 * @param filePath Path to the DOCX file
 * @returns Extracted text content
 */
async function convertDocxToText(filePath: string): Promise<string> {
  try {
    console.log(`Processing DOCX file: ${filePath}`);
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length < 50) {
      console.warn("Warning: DOCX content was very short or empty");
    }
    
    console.log(`Successfully extracted text from DOCX, length: ${result.value.length} characters`);
    if (result.messages.length > 0) {
      console.log("Mammoth extraction messages:", result.messages);
    }
    
    return result.value;
  } catch (error) {
    console.error("Error converting DOCX to text:", error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes an uploaded CV file and extracts its text content
 * @param file The uploaded file from multer
 * @returns Object containing extracted text content
 */
export async function processUploadedCV(file: Express.Multer.File): Promise<{ textContent: string }> {
  // Create a temporary file path
  const tempDir = os.tmpdir();
  const tempFilePath = path.join(tempDir, file.originalname);
  
  try {
    // Write the buffer to a temporary file
    await writeFile(tempFilePath, file.buffer);
    
    // Extract text based on file type
    let textContent: string;
    if (file.mimetype === 'application/pdf') {
      textContent = await convertPdfToText(tempFilePath);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      textContent = await convertDocxToText(tempFilePath);
    } else {
      throw new Error('Unsupported file type');
    }
    
    // Clean up the temporary file
    await unlink(tempFilePath);
    
    return { textContent };
  } catch (error) {
    // Ensure temp file is deleted even if an error occurs
    try {
      if (fs.existsSync(tempFilePath)) {
        await unlink(tempFilePath);
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
    
    console.error("Error processing uploaded CV:", error);
    
    // Throw the error to be handled by the route handler
    throw new Error(`Failed to process CV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}