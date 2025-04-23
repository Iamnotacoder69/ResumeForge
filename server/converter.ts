import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import * as pdfParse from './pdf-wrapper';

/**
 * Convert any supported file to DOCX format
 * Currently just returns the original file path as we focus on Word document parsing
 * @param filePath Path to the uploaded file
 * @param fileType MIME type of the file
 * @returns Path to the file (original or converted)
 */
export async function convertToDocx(filePath: string, fileType: string): Promise<string> {
  // If it's already a Word document, no conversion needed
  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    console.log('File is already in DOCX format, no conversion needed');
    return filePath;
  }

  // For now, we'll just return the file path without conversion
  // The parseCV function will handle different file types accordingly
  console.log(`File conversion from ${fileType} to DOCX will be implemented in a future update`);
  return filePath;
}

/**
 * Extract text from a DOCX file
 * @param filePath Path to the DOCX file
 * @returns Extracted text content
 */
export async function extractTextFromDocx(filePath: string): Promise<string> {
  try {
    // Use mammoth to extract text from DOCX
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (result.value.length < 100) {
      console.log('Warning: Very little text extracted from Word document');
    }
    
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX file');
  }
}

/**
 * Extract text from a PDF file
 * @param filePath Path to the PDF file
 * @returns Extracted text content
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Extract text from PDF
    const pdfData = await pdfParse.parsePDF(dataBuffer);
    console.log(`Extracted PDF text length: ${pdfData.text.length}`);
    
    // If we extracted a reasonable amount of text
    if (pdfData.text.length > 300) {
      return pdfData.text;
    } else {
      console.log("PDF extraction returned minimal text. PDF may be image-based.");
      return "";
    }
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "";
  }
}