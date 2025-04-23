import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle } from 'docx';
import { extractPDFText, PDFData } from './mock-pdf-parse';

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
    console.log(`PDF has ${pdfData.numpages} pages, extracted ${pdfData.text.length} characters`);
    
    if (pdfData.text.length > 100) {
      // Successful extraction
      console.log(`CV sections identified: ${Object.keys(pdfData.sections || {}).join(', ')}`);
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
 * Create a structured DOCX document from PDF sections
 * Optimized for CV/resume content with section-based organization
 * @param pdfPath Path to the PDF file
 * @returns Path to the created structured DOCX file
 */
export async function convertPDFtoDOCX(pdfPath: string): Promise<string> {
  try {
    console.log(`Converting PDF to DOCX: ${path.basename(pdfPath)}`);
    
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
    const docxPath = path.join(tempDir, `${fileHash}.docx`);

    // Array to collect document paragraphs
    const docElements: Paragraph[] = [];
    
    // Add document title
    docElements.push(
      new Paragraph({
        text: "CV / Resume",
        heading: HeadingLevel.TITLE,
        thematicBreak: true,
      })
    );
    
    // Check if sections were identified
    const hasSections = cvData.sections && Object.keys(cvData.sections).length > 0;
    
    if (hasSections && cvData.sections) {
      // Structure document by CV sections
      const sectionOrder = [
        "PERSONAL", "SUMMARY", "SKILLS", "EXPERIENCE", 
        "EDUCATION", "CERTIFICATIONS", "LANGUAGES", "ADDITIONAL"
      ];
      
      const sectionTitles: Record<string, string> = {
        "PERSONAL": "Personal Information",
        "SUMMARY": "Professional Summary",
        "SKILLS": "Skills & Competencies",
        "EXPERIENCE": "Work Experience",
        "EDUCATION": "Education",
        "CERTIFICATIONS": "Certifications",
        "LANGUAGES": "Languages",
        "ADDITIONAL": "Additional Information"
      };
      
      // Add each section in order
      for (const sectionKey of sectionOrder) {
        // Safely check if this key exists in sections
        if (sectionKey in cvData.sections) {
          // Get the content
          const sectionContent = (cvData.sections as Record<string, string>)[sectionKey];
          if (sectionContent) {
            // Add section heading with proper type handling
            const title = sectionKey in sectionTitles ? sectionTitles[sectionKey] : sectionKey;
            docElements.push(
              new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_1,
                spacing: {
                  before: 400,
                  after: 200
                }
              })
            );
            
            // Add section content (split by lines for better formatting)
            const contentLines = sectionContent.split('\n');
            for (const line of contentLines) {
              if (line.trim().length > 0) {
                docElements.push(
                  new Paragraph({
                    text: line,
                    spacing: {
                      before: 80,
                      after: 80
                    }
                  })
                );
              }
            }
          }
        }
      }
    } else {
      // No sections identified, just use the full text with some basic structure
      console.log("No CV sections identified, using simple text approach");
      
      // Show a note about this
      docElements.push(
        new Paragraph({
          text: "CV Text Content",
          heading: HeadingLevel.HEADING_1,
        })
      );
      
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
      
      // Split by lines for better formatting
      const textLines = processedText.split('\n');
      
      // Handle text in chunks for better document structure
      let currentParagraph: string[] = [];
      
      for (const line of textLines) {
        if (line.trim().length === 0 && currentParagraph.length > 0) {
          // Empty line means end of paragraph
          docElements.push(
            new Paragraph({
              text: currentParagraph.join(' '),
              spacing: {
                before: 120,
                after: 120
              }
            })
          );
          currentParagraph = [];
        } else if (line.trim().length > 0) {
          currentParagraph.push(line.trim());
        }
      }
      
      // Add any remaining paragraph
      if (currentParagraph.length > 0) {
        docElements.push(
          new Paragraph({
            text: currentParagraph.join(' '),
            spacing: {
              before: 120,
              after: 120
            }
          })
        );
      }
    }
    
    // Create the document with all elements
    const doc = new Document({
      sections: [{
        properties: {},
        children: docElements
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