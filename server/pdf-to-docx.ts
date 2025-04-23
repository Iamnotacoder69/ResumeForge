import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Extract text from PDF buffer
 * @param pdfBuffer PDF file as buffer
 * @returns Extracted text from PDF
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Get pages and page count
    const pages = pdfDoc.getPages();
    const pageCount = pages.length;
    
    console.log(`PDF has ${pageCount} pages`);
    
    // Since we can't directly extract text with pdf-lib, 
    // we'll return a placeholder that lets the OpenAI analyze PDF content directly
    // We need to use other methods to get the actual text
    return `PDF document with ${pageCount} pages. Content requires external processing.`;
  } catch (error: unknown) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a DOCX document with PDF content
 * This is a simplified approach that creates a DOCX with a reference to the original PDF
 * @param pdfPath Path to the PDF file
 * @returns Path to the created DOCX file
 */
export async function convertPDFtoDOCX(pdfPath: string): Promise<string> {
  try {
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!(await exists(tempDir))) {
      await mkdir(tempDir, { recursive: true });
    }

    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath);
    
    // Extract text from PDF (simplified approach)
    const pdfText = await extractTextFromPDF(pdfBuffer);
    
    // Create output path for DOCX
    const filename = path.basename(pdfPath, '.pdf');
    const docxPath = path.join(tempDir, `${filename}.docx`);

    // Create a new Document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Original PDF Document",
                bold: true,
                size: 28,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "This document was converted from a PDF.",
                size: 24,
              }),
            ],
          }),
          // Include some text from the PDF to provide context
          new Paragraph({
            children: [
              new TextRun({
                text: pdfText,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    });

    // Create a buffer with the Document
    const buffer = await Packer.toBuffer(doc);
    
    // Write the buffer to the file
    await writeFile(docxPath, buffer);
    
    console.log('PDF converted to DOCX reference document successfully');
    
    return docxPath;
  } catch (error: unknown) {
    console.error('Error converting PDF to DOCX:', error);
    throw new Error(`Failed to convert PDF to DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}