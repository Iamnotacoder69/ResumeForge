import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readFile = promisify(fs.readFile);

/**
 * Extract text from a PDF file using pdf-parse library
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
async function convertPdfToText(filePath: string): Promise<string> {
  try {
    console.log(`Processing PDF file: ${filePath}`);
    
    // Read the PDF file
    const dataBuffer = await readFile(filePath);
    
    // Try extracting text with pdf-parse
    const data = await pdfParse(dataBuffer);
    
    // Check if we got good content
    if (!data.text || data.text.trim().length < 100) {
      console.warn("WARNING: Extracted PDF text is very short, adding file metadata");
      
      // Get file stats for metadata
      const stats = await fs.promises.stat(filePath);
      
      // If the text is empty or too short, include metadata and a message
      const pdfInfo = `
PDF Analysis Report:
Filename: ${filePath.split('/').pop()}
File size: ${stats.size} bytes
Page count: ${data.numpages}
Creation date: ${data.info?.CreationDate || 'Unknown'}
Producer: ${data.info?.Producer || 'Unknown'}

The PDF contains limited extractable text. This may be because:
1. The PDF contains mostly images or scanned content
2. The PDF uses custom fonts or encoding
3. The text is stored in a format that's difficult to extract

The content that could be extracted is provided below:
-------------------------------------------
${data.text}
-------------------------------------------

For best results, please upload a text-based PDF or a DOCX file.
`;
      
      // Return the combined info
      console.log(`Returning PDF text with metadata, total length: ${pdfInfo.length} characters`);
      return pdfInfo;
    }
    
    // Process the extracted text to preserve bullet points and special formatting
    let processedText = data.text;
    
    // Preserve bullet points - PDF can have various bullet point formats
    // Common patterns: • ● ○ ▪ ▫ ◦ ► ▶ ◾ ◽ ◼ ◻
    // Also standard ASCII bullets like * - + and numbered bullets like 1. 2. a. b. i. ii.
    
    // Step 1: Identify bullet-based lines and ensure they have proper spacing
    processedText = processedText.replace(/(\n\s*[-•●○▪▫◦►▶◾◽◼◻*+]|\n\s*\d+\.|\n\s*[a-z]+\.|\n\s*[ivxIVX]+\.)\s+/g, "\n• ");
    
    // Step 2: Make sure there's proper spacing between paragraphs
    processedText = processedText.replace(/\n{3,}/g, "\n\n"); // Normalize multiple newlines
    
    // Step 3: Clean any broken hyphenations often found in PDFs
    processedText = processedText.replace(/(\w+)-\n(\w+)/g, "$1$2");
    
    console.log(`Successfully extracted and processed text from PDF, length: ${processedText.length} characters`);
    return processedText;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    
    // Get file stats for metadata
    try {
      const stats = await fs.promises.stat(filePath);
      
      // Return an error with file info
      return `
Error extracting text from PDF file:
Filename: ${filePath.split('/').pop()}
File size: ${stats.size} bytes
Error: ${error instanceof Error ? error.message : 'Unknown error'}

For best results, please upload a text-based PDF or a DOCX file.
`;
    } catch (statsError) {
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    
    // Extract the raw text from the DOCX
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length < 50) {
      console.warn("Warning: DOCX content was very short or empty");
    }
    
    // Process the extracted text to preserve bullet points and special formatting
    let processedText = result.value;
    
    // Common patterns for bullet points in documents
    // Look for potential list items and ensure they're marked with bullets consistently
    processedText = processedText.replace(/(\n\s*[-•●○▪▫◦►▶◾◽◼◻*+]|\n\s*\d+\.|\n\s*[a-z]+\.|\n\s*[ivxIVX]+\.)\s+/g, "\n• ");
    
    // Normalize spacing between paragraphs
    processedText = processedText.replace(/\n{3,}/g, "\n\n");
    
    console.log(`Successfully extracted and processed text from DOCX, length: ${processedText.length} characters`);
    if (result.messages.length > 0) {
      console.log("Mammoth extraction messages:", result.messages);
    }
    
    return processedText;
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