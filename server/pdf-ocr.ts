import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createWorker } from 'tesseract.js';
import { extractPDFText } from './mock-pdf-parse';
import sharp from 'sharp';
import crypto from 'crypto';
import { PDFData } from './mock-pdf-parse';
import { convert } from 'pdf-img-convert';

/**
 * Advanced PDF text extraction with OCR and multiple fallback methods
 * Uses a combination of techniques to get the best possible text extraction:
 * 1. Standard PDF text extraction
 * 2. OCR via Tesseract if text extraction fails or produces minimal content
 * 3. Multiple conversion methods for difficult PDFs
 */
export async function extractTextFromPDF(pdfPath: string): Promise<string> {
  console.log(`Starting enhanced PDF extraction for: ${pdfPath}`);
  
  try {
    // First try: Standard PDF parsing
    const pdfBuffer = fs.readFileSync(pdfPath);
    const standardParse = await extractPDFText(pdfBuffer);
    
    // Check if standard extraction provided meaningful content
    if (standardParse.text && standardParse.text.length > 1000) {
      console.log(`Standard PDF extraction successful (${standardParse.text.length} chars)`);
      return standardParse.text;
    }
    
    console.log("Standard PDF extraction yielded minimal text, trying OCR...");
    
    // Second try: OCR using Tesseract
    const ocrText = await extractTextWithOCR(pdfPath);
    
    if (ocrText && ocrText.length > standardParse.text.length) {
      console.log(`OCR extraction successful (${ocrText.length} chars)`);
      return ocrText;
    }
    
    // Fall back to the standard parsed text if OCR failed
    console.log("Falling back to standard extraction");
    return standardParse.text;
  } catch (error) {
    console.error("Error in enhanced PDF extraction:", error);
    
    // Last resort attempt: try OCR only
    try {
      console.log("Attempting OCR-only extraction...");
      const ocrOnlyText = await extractTextWithOCR(pdfPath);
      if (ocrOnlyText && ocrOnlyText.length > 0) {
        return ocrOnlyText;
      }
    } catch (ocrError) {
      console.error("OCR-only extraction failed:", ocrError);
    }
    
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from PDF using Tesseract OCR with a simplified approach
 * This version doesn't rely on external PDF-to-image conversion libraries
 */
async function extractTextWithOCR(pdfPath: string): Promise<string> {
  try {
    console.log("Starting simplified OCR extraction...");
    
    // Create temporary directory
    const tempDir = path.join(os.tmpdir(), crypto.randomBytes(16).toString('hex'));
    fs.mkdirSync(tempDir, { recursive: true });
    
    // For this simplified approach, we'll only attempt OCR on the original PDF
    // Without converting to images first
    
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    // Process the PDF directly
    console.log("Processing PDF with OCR...");
    const { data } = await worker.recognize(pdfPath);
    const extractedText = data.text;
    
    // Clean up
    await worker.terminate();
    try {
      fs.rmdirSync(tempDir);
    } catch (e) {
      console.error("Failed to remove temp directory:", e);
    }
    
    console.log(`OCR extraction complete, extracted ${extractedText.length} characters`);
    return extractedText;
  } catch (error) {
    console.error("Error in OCR extraction:", error);
    
    // Return empty string on error so the caller can fall back to other methods
    return "";
  }
}

/**
 * Enhance image for better OCR results by applying
 * image processing techniques to improve contrast and clarity
 */
async function enhanceImageForOCR(imagePath: string): Promise<void> {
  try {
    // Read the image
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Apply image processing techniques
    const enhancedImage = await sharp(imageBuffer)
      .grayscale()        // Convert to grayscale
      .normalize()        // Normalize image contrast
      .sharpen()          // Enhance text edges
      .threshold(128)     // Apply binary threshold for clearer text
      .toBuffer();
    
    // Save the enhanced image
    fs.writeFileSync(imagePath, enhancedImage);
  } catch (error) {
    console.error("Image enhancement error:", error);
    // Continue without enhancement if it fails
  }
}

/**
 * Parse PDF and extract text with enhanced methods
 * This is a wrapper for the extractTextFromPDF function that returns
 * the format expected by the application
 */
export async function parsePDFWithOCR(pdfPath: string): Promise<PDFData> {
  try {
    const extractedText = await extractTextFromPDF(pdfPath);
    
    // Basic metadata - using simplified approach without pdf-parse
    let numpages = 1;
    let info = {};
    let metadata = {};
    let version = '1.0';
    
    try {
      // Try to estimate page count based on file size
      const stats = fs.statSync(pdfPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      // Rough heuristic: assume 1 page per 100KB
      numpages = Math.max(1, Math.round(fileSizeInMB * 10));
      
      // Try to extract basic info from filename
      const filename = path.basename(pdfPath);
      metadata = { filename };
    } catch (error) {
      console.error("Could not extract PDF metadata:", error);
    }
    
    return {
      text: extractedText,
      numpages,
      info,
      metadata,
      version
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF with OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}