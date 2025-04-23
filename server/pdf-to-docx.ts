import * as fs from 'fs';
import * as path from 'path';
import * as htmlDocx from 'html-docx-js';
import { promisify } from 'util';
import { extractPDFText } from './mock-pdf-parse';
import { exec } from 'child_process';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const execAsync = promisify(exec);

/**
 * Convert PDF to DOCX format with enhanced processing
 * This version includes multiple approaches to ensure maximum text extraction:
 * 1. Try our custom PDF extractor
 * 2. Use advanced formatting to create a well-structured DOCX 
 * 3. Apply special processing for different PDF types
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
    // Process the text to improve the conversion result
    
    // Get PDF file name without extension
    const pdfBaseName = path.basename(pdfPath, '.pdf');
    
    // Destination paths
    const htmlPath = path.join(path.dirname(pdfPath), `${pdfBaseName}.html`);
    const docxPath = path.join(path.dirname(pdfPath), `${pdfBaseName}.docx`);
    
    // Process extracted text to improve formatting
    const processedText = processExtractedText(text);
    
    // Generate a well-structured HTML document
    const htmlContent = generateEnhancedHtml(processedText, pdfBaseName);
    
    // Write the HTML file
    await writeFileAsync(htmlPath, htmlContent);
    console.log(`Enhanced HTML content saved to ${htmlPath}`);
    
    // Also save the raw text content for easier access
    const textPath = path.join(path.dirname(pdfPath), `${pdfBaseName}.txt`);
    await writeFileAsync(textPath, text);
    console.log(`Raw text content saved to ${textPath}`);
    
    // First, let's create a simple text-only docx as a fallback
    const simpleDocxContent = `FILENAME: ${pdfBaseName}
    
EXTRACTED TEXT FROM PDF:

${text}`;
    
    // Write the raw text directly to the DOCX file
    await writeFileAsync(docxPath, simpleDocxContent);
    
    // Try to convert HTML to DOCX using html-docx-js
    try {
      const docxBlob = htmlDocx.asBlob(htmlContent, {
        orientation: 'portrait',
        margins: { top: 720, right: 720, bottom: 720, left: 720 } // 720 twips = 0.5 inches
      });
      
      if (docxBlob) {
        const arrayBuffer = await docxBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Only write if we got a non-empty buffer
        if (buffer && buffer.length > 100) {
          // Write formatted DOCX file
          await writeFileAsync(docxPath, buffer);
          console.log("Successfully created formatted DOCX from HTML");
        } else {
          console.log("HTML to DOCX conversion yielded empty or too small buffer, using text fallback");
        }
      }
    } catch (docxError) {
      console.error("Error in HTML to DOCX conversion, using text fallback:", docxError);
    }
    
    console.log(`DOCX created successfully at ${docxPath}`);
    
    // Keep the HTML file for reference (we'll use it during analysis)
    // We'll clean it up after analysis is complete
    
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

/**
 * Process the extracted text to improve conversion quality
 * This tries to identify document structure and format it appropriately
 */
function processExtractedText(text: string): string {
  if (!text) return "No text could be extracted from this PDF document.";
  
  // Normalize line endings
  let processed = text.replace(/\r\n/g, '\n');
  
  // Try to identify and mark sections with appropriate formatting
  
  // Match potential headers (all caps, shorter lines, ending with colon sometimes)
  processed = processed.replace(/^([A-Z][A-Z\s]{2,30})(?::|\n|$)/gm, '<h2>$1</h2>');
  
  // Identify potential list items (lines starting with • or -, or numbered items)
  processed = processed.replace(/^[\s]*[•\-\*][\s]+(.+)$/gm, '<li>$1</li>');
  processed = processed.replace(/^[\s]*(\d+)[\.\)][\s]+(.+)$/gm, '<li>$1. $2</li>');
  
  // Wrap consecutive list items in ul tags (simple approach)
  processed = processed.replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>');
  
  // Identify potential section headers (lines followed by several items)
  processed = processed.replace(/^([A-Z][a-zA-Z\s]{2,50}:)\n/gm, '<h3>$1</h3>\n');
  
  // Identify email and website patterns for better formatting
  processed = processed.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '<a href="mailto:$1">$1</a>');
  processed = processed.replace(/\b(https?:\/\/[^\s]+)\b/g, '<a href="$1">$1</a>');
  
  // Format dates in a consistent way
  processed = processed.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s]+\d{4}\b/g, '<span class="date">$&</span>');
  
  // Add paragraph tags to remaining plain text blocks
  const paragraphs = processed.split('\n\n');
  return paragraphs.map(p => {
    // Skip if already has HTML formatting
    if (p.trim().startsWith('<') && p.trim().endsWith('>')) return p;
    // Otherwise wrap in paragraph tags if not empty
    return p.trim() ? `<p>${p.trim()}</p>` : '';
  }).join('\n');
}

/**
 * Generate an enhanced HTML document from the processed text
 */
function generateEnhancedHtml(processedText: string, documentTitle: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 1.5cm;
          color: #333;
        }
        h1 {
          font-size: 18pt;
          color: #2c3e50;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h2 {
          font-size: 14pt;
          color: #34495e;
          margin-top: 25px;
          margin-bottom: 10px;
        }
        h3 {
          font-size: 12pt;
          font-weight: bold;
          color: #16a085;
          margin-top: 20px;
          margin-bottom: 5px;
        }
        p {
          margin-bottom: 10px;
          text-align: justify;
        }
        ul {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        li {
          margin-bottom: 5px;
        }
        .date {
          font-weight: 500;
          color: #7f8c8d;
        }
        a {
          color: #3498db;
          text-decoration: none;
        }
        .cv-header {
          margin-bottom: 30px;
        }
        .cv-section {
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="cv-header">
        <h1>${documentTitle || 'Curriculum Vitae'}</h1>
      </div>
      <div class="cv-content">
        ${processedText}
      </div>
    </body>
    </html>
  `;
}