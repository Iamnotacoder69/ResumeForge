import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { extractPDFText } from './mock-pdf-parse';
import * as mammoth from 'mammoth';
// Don't import pdf-parse directly as it has initialization issues
import { Document, Paragraph, Packer, TextRun } from 'docx';

/**
 * Convert PDF to Word document
 * 
 * This approach extracts text from a PDF and creates a Word document
 * with the extracted text to enable better processing.
 */
export async function convertPdfToDocx(pdfPath: string): Promise<string> {
  try {
    // Attempt to extract text directly from PDF
    const pdfText = await extractTextFromPdf(pdfPath);
    
    // Create a temporary docx file that contains the text from the PDF
    const docxPath = await createDocxFromText(pdfText, pdfPath);
    
    return docxPath;
  } catch (error) {
    console.error('Error converting PDF to Word:', error instanceof Error ? error.message : String(error));
    throw new Error('Failed to convert PDF to Word document');
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath);
  
  try {
    // Skip pdf-parse due to initialization issues, directly use our custom extraction
    const result = await extractPDFText(dataBuffer);
    
    if (result.text.length > 100) {
      console.log(`Extracted text from PDF using custom method, length: ${result.text.length}`);
      return result.text;
    }
    
    // If we got very little text, add context
    const fileName = path.basename(pdfPath);
    console.log("Minimal text extracted from PDF, adding context from filename");
    
    return `This appears to be a CV/resume document named "${fileName}".
The following text fragments were extracted:

${result.text}

Please analyze this as a CV and extract all available information about the candidate,
making reasonable assumptions when specific details aren't clear.`;
    
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Create a DOCX file from plain text
 */
async function createDocxFromText(text: string, originalPdfPath: string): Promise<string> {
  // Create paragraphs from text, ensuring each line becomes a paragraph
  const paragraphs = text.split('\n').map(line => 
    new Paragraph({
      children: [new TextRun(line.trim() || ' ')] // Ensure empty lines still create paragraphs
    })
  );
  
  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });
  
  // Create output path
  const tempDir = os.tmpdir();
  const docxFileName = path.basename(originalPdfPath, '.pdf') + '.docx';
  const docxPath = path.join(tempDir, docxFileName);
  
  // Generate document buffer
  const buffer = await Packer.toBuffer(doc);
  
  // Write to file
  fs.writeFileSync(docxPath, buffer);
  
  console.log(`Created Word document at ${docxPath}`);
  return docxPath;
}

/**
 * Extract text from DOCX file
 */
export async function extractTextFromDocx(docxPath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: docxPath });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from Word document');
  }
}