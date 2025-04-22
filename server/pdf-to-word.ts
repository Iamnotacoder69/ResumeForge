import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as os from 'os';
import * as util from 'util';

const execPromise = util.promisify(exec);

/**
 * Convert PDF to Word document using pdf2docx
 * 
 * Note: This approach requires Python and pdf2docx to be installed in the system.
 * Since we can't install Python packages directly in the Node.js environment,
 * we'll create a strategy that works with the tools we have.
 */
export async function convertPdfToDocx(pdfPath: string): Promise<string> {
  try {
    // Attempt to extract text directly from PDF
    const pdfText = await extractTextFromPdf(pdfPath);
    
    // Create a temporary docx file that contains the text from the PDF
    const docxPath = await createDocxFromText(pdfText, pdfPath);
    
    return docxPath;
  } catch (error) {
    console.error('Error converting PDF to Word:', error);
    throw new Error('Failed to convert PDF to Word document');
  }
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPdf(pdfPath: string): Promise<string> {
  const pdfParse = require('pdf-parse');
  const dataBuffer = fs.readFileSync(pdfPath);
  
  try {
    // First attempt with pdf-parse
    const data = await pdfParse(dataBuffer);
    
    if (data.text && data.text.length > 100) {
      return data.text;
    }
    
    // If pdf-parse doesn't return much text, try our custom extraction
    const { extractPDFText } = require('./mock-pdf-parse');
    const result = await extractPDFText(dataBuffer);
    
    return result.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Create a DOCX file from plain text
 */
async function createDocxFromText(text: string, originalPdfPath: string): Promise<string> {
  const docx = require('docx');
  const { Document, Packer, Paragraph, TextRun } = docx;
  
  // Create paragraphs from text
  const paragraphs = text.split('\n').map(line => 
    new Paragraph({
      children: [new TextRun(line.trim())]
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
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: docxPath });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw error;
  }
}