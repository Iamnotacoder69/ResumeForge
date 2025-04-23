import * as fs from 'fs';
import * as path from 'path';
import * as htmlDocx from 'html-docx-js';
import { promisify } from 'util';
import { extractPDFText } from './mock-pdf-parse';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

/**
 * Convert PDF to DOCX format
 * This is a two-step process:
 * 1. PDF to HTML (using our own PDF text extraction)
 * 2. HTML to DOCX (using html-docx-js)
 */
export async function convertPdfToDocx(pdfPath: string): Promise<string> {
  try {
    console.log(`Converting PDF at ${pdfPath} to DOCX...`);
    
    // Read the PDF file
    const pdfBuffer = await readFileAsync(pdfPath);
    
    // Use our existing PDF parser to extract text
    const pdfData = await extractPDFText(pdfBuffer);
    const text = pdfData.text;
    console.log(`Extracted ${text.length} characters of text from PDF`);
    
    // Create HTML content from the extracted text
    // Split text into paragraphs for better formatting
    const paragraphs = text.split('\n\n');
    
    // Create simple HTML document with the extracted text
    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2cm; }
          h1 { color: #333; margin-bottom: 1em; }
          p { margin-bottom: 0.5em; text-align: justify; }
        </style>
      </head>
      <body>
        <h1>Converted PDF Document</h1>
        ${paragraphs.map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('\n')}
      </body>
      </html>
    `;
    
    // Create temporary HTML file
    const htmlPath = path.join(path.dirname(pdfPath), `${path.basename(pdfPath, '.pdf')}.html`);
    await writeFileAsync(htmlPath, htmlContent);
    
    console.log(`HTML content saved to ${htmlPath}`);
    
    // Convert HTML to DOCX
    const docxPath = path.join(path.dirname(pdfPath), `${path.basename(pdfPath, '.pdf')}.docx`);
    
    // Convert HTML to DOCX using html-docx-js
    const docxBlob = htmlDocx.asBlob(htmlContent);
    const arrayBuffer = await docxBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Write DOCX file
    await writeFileAsync(docxPath, buffer);
    
    console.log(`DOCX created successfully at ${docxPath}`);
    
    // Clean up the HTML file
    fs.unlinkSync(htmlPath);
    
    // Return the path to the DOCX file
    return docxPath;
  } catch (error: unknown) {
    console.error('Error converting PDF to DOCX:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to convert PDF to DOCX: ${error.message}`);
    } else {
      throw new Error(`Failed to convert PDF to DOCX: Unknown error`);
    }
  }
}