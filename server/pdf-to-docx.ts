import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { extractPDFText, PDFData } from './mock-pdf-parse';
import * as mammoth from 'mammoth';

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Advanced PDF text extraction that specializes in CV/resume content
 * This extracts text AND sections from PDFs intelligently
 * @param pdfBuffer PDF file as buffer
 * @returns Extracted data with both full text and identified sections
 */
async function extractCVDataFromPDF(pdfBuffer: Buffer): Promise<PDFData> {
  try {
    // Use our advanced CV-optimized PDF text extraction
    const pdfData = await extractPDFText(pdfBuffer);
    console.log(`PDF has ${pdfData.numpages || 1} pages, extracted ${pdfData.text.length} characters`);
    
    if (pdfData.text.length > 100) {
      // Successful extraction
      if (pdfData.sections) {
        console.log(`CV sections identified: ${Object.keys(pdfData.sections).join(', ')}`);
      } else {
        console.log('No CV sections identified in the document');
      }
      return pdfData;
    } else {
      console.warn("Limited text extracted from PDF - likely a scanned document");
      return pdfData;
    }
  } catch (error: unknown) {
    console.error('Error extracting CV data from PDF:', error);
    
    // Return minimal data on error
    return {
      text: "Error extracting text from PDF. The document may be password-protected, corrupted, or contain no extractable text.",
      numpages: 0,
      sections: {}
    };
  }
}

/**
 * Extract text from DOCX document
 * @param docxBuffer DOCX file as buffer
 * @returns Extracted plain text
 */
async function extractTextFromDOCX(docxBuffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: docxBuffer });
    const text = result.value;
    console.log(`Extracted ${text.length} characters from DOCX`);
    return text;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    return "Error extracting text from DOCX file.";
  }
}

/**
 * Convert PDF to plain text file
 * Uses advanced section-based CV parsing to create a structured text file
 * @param pdfPath Path to the PDF file
 * @returns Path to the created TXT file
 */
export async function convertPDFtoTXT(pdfPath: string): Promise<string> {
  try {
    console.log(`Converting PDF to TXT: ${path.basename(pdfPath)}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!(await exists(tempDir))) {
      await mkdir(tempDir, { recursive: true });
    }

    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath);
    
    // Extract text and sections from PDF
    const cvData = await extractCVDataFromPDF(pdfBuffer);
    
    // Create a unique hash for the filename to avoid collisions
    const fileHash = Math.random().toString(36).substring(2, 15);
    const txtPath = path.join(tempDir, `${fileHash}.txt`);

    // Built text content with structured format
    let textContent = "CV / RESUME CONTENT\n\n";
    
    // Check if sections were identified
    const hasSections = cvData.sections && Object.keys(cvData.sections).length > 0;
    
    if (hasSections && cvData.sections) {
      // Structure document by CV sections
      const sectionOrder = [
        "PERSONAL", "SUMMARY", "SKILLS", "EXPERIENCE", 
        "EDUCATION", "CERTIFICATIONS", "LANGUAGES", "ADDITIONAL"
      ];
      
      const sectionTitles: Record<string, string> = {
        "PERSONAL": "PERSONAL INFORMATION",
        "SUMMARY": "PROFESSIONAL SUMMARY",
        "SKILLS": "SKILLS & COMPETENCIES",
        "EXPERIENCE": "WORK EXPERIENCE",
        "EDUCATION": "EDUCATION",
        "CERTIFICATIONS": "CERTIFICATIONS",
        "LANGUAGES": "LANGUAGES",
        "ADDITIONAL": "ADDITIONAL INFORMATION"
      };
      
      // Add each section in order
      for (const sectionKey of sectionOrder) {
        // Safely check if this key exists in sections
        if (sectionKey in cvData.sections) {
          // Get the content
          const sectionContent = (cvData.sections as Record<string, string>)[sectionKey];
          if (sectionContent && sectionContent.trim().length > 0) {
            // Add section heading with proper type handling
            const title = sectionKey in sectionTitles ? sectionTitles[sectionKey] : sectionKey;
            textContent += `### ${title} ###\n\n${sectionContent.trim()}\n\n`;
          }
        }
      }
    } else {
      // No sections identified, just use the full text with some basic structure
      console.log("No CV sections identified, using simple text approach");
      
      // If the text is too long for OpenAI, truncate it intelligently
      let processedText = cvData.text;
      const MAX_TEXT_LENGTH = 15000;
      
      if (processedText.length > MAX_TEXT_LENGTH) {
        console.log(`CV text is very long (${processedText.length} chars), truncating to ~${MAX_TEXT_LENGTH} chars`);
        
        // Keep first 8,000 chars (usually the most relevant)
        const firstPart = processedText.substring(0, 8000);
        
        // Keep middle 4,000 chars (usually work experience)
        const middleStart = Math.floor(processedText.length / 3);
        const middlePart = processedText.substring(middleStart, middleStart + 4000);
        
        // Keep last 3,000 chars (education, etc.)
        const lastPart = processedText.substring(processedText.length - 3000);
        
        processedText = `${firstPart}\n\n[...content truncated due to length...]\n\n${middlePart}\n\n[...content truncated due to length...]\n\n${lastPart}`;
        console.log(`Truncated to ${processedText.length} chars`);
      }
      
      textContent += processedText;
    }
    
    // Write the text content to the file
    await writeFile(txtPath, textContent);
    
    console.log('PDF converted to TXT file successfully');
    
    return txtPath;
  } catch (error: unknown) {
    console.error('Error converting PDF to TXT:', error);
    throw new Error(`Failed to convert PDF to TXT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert DOCX to plain text file
 * @param docxPath Path to the DOCX file
 * @returns Path to the created TXT file
 */
export async function convertDOCXtoTXT(docxPath: string): Promise<string> {
  try {
    console.log(`Converting DOCX to TXT: ${path.basename(docxPath)}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!(await exists(tempDir))) {
      await mkdir(tempDir, { recursive: true });
    }

    // Read the DOCX file
    const docxBuffer = await readFile(docxPath);
    
    // Extract text from DOCX
    const text = await extractTextFromDOCX(docxBuffer);
    
    // Create a unique hash for the filename to avoid collisions
    const fileHash = Math.random().toString(36).substring(2, 15);
    const txtPath = path.join(tempDir, `${fileHash}.txt`);

    // Write the text content to the file
    await writeFile(txtPath, text);
    
    console.log('DOCX converted to TXT file successfully');
    
    return txtPath;
  } catch (error: unknown) {
    console.error('Error converting DOCX to TXT:', error);
    throw new Error(`Failed to convert DOCX to TXT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}