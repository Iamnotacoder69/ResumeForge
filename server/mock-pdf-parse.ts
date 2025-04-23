/**
 * Advanced PDF text extraction utility specifically optimized for CV/resume parsing
 */

import { PDFDocument } from 'pdf-lib';

// Define the PDF output interface
export interface PDFData {
  text: string;
  numpages: number;
  info?: Record<string, any>;
  metadata?: Record<string, any>;
  version?: string;
  sections?: Record<string, string>;
}

// CV/Resume common section markers (case insensitive)
const SECTION_MARKERS = {
  PERSONAL: ['personal information', 'personal details', 'contact', 'contact information', 'profile'],
  SUMMARY: ['summary', 'professional summary', 'career objective', 'objective', 'about me', 'profile', 'professional profile'],
  SKILLS: ['skills', 'technical skills', 'core skills', 'competencies', 'key skills', 'expertise', 'technologies'],
  EXPERIENCE: ['experience', 'work experience', 'employment history', 'professional experience', 'work history', 'career history'],
  EDUCATION: ['education', 'academic', 'qualifications', 'academic background', 'educational background'],
  CERTIFICATIONS: ['certifications', 'certificates', 'professional certifications', 'qualifications', 'courses'],
  LANGUAGES: ['languages', 'language skills', 'language proficiency'],
  ADDITIONAL: ['additional', 'additional information', 'interests', 'hobbies', 'volunteer', 'activities']
};

/**
 * Advanced PDF text extraction that attempts to extract text from PDFs
 * and intelligently categorize content into CV/resume sections
 */
export async function extractPDFText(buffer: Buffer): Promise<PDFData> {
  try {
    let text = '';
    let sections: Record<string, string> = {};
    let pdfDoc: any;
    
    try {
      // Try to extract text using pdf-lib first
      pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      // Extract text from buffer using UTF-8 and more robust approach
      const rawText = buffer.toString('utf-8', 0, buffer.length);
      
      // Early check: if we have text content in the raw buffer
      if (rawText.length > 1000) {
        // Clean up the raw text - remove non-printable characters but preserve newlines
        text = rawText.replace(/[^\x20-\x7E\r\n\t]/g, ' ')
                      .replace(/\s{3,}/g, '\n') // Multiple spaces might be paragraph breaks
                      .trim();
        
        console.log(`Extracted ${text.length} raw characters from PDF`);
      } else {
        // If raw extraction doesn't yield good results, fall back to a different approach
        // Here we're using a simple approach that works with text-based PDFs
        text = await extractTextFromBinaryPDF(buffer);
        console.log(`Used binary extraction approach: ${text.length} characters`);
      }
      
      // Identify CV sections using common markers
      sections = identifyCVSections(text);
      
      return {
        text: text,
        numpages: pageCount,
        info: {
          title: pdfDoc.getTitle() || '',
          author: pdfDoc.getAuthor() || '',
          subject: pdfDoc.getSubject() || '',
          keywords: pdfDoc.getKeywords() || ''
        },
        metadata: {},
        version: '1.1',
        sections: sections
      };
    } catch (pdfLibError) {
      console.warn("pdf-lib extraction failed, using fallback extraction method", pdfLibError);
      
      // Fallback to binary parsing approach
      text = await extractTextFromBinaryPDF(buffer);
      
      // Try to identify sections even with the fallback approach
      sections = identifyCVSections(text);
      
      return {
        text: text,
        numpages: 1, // Unknown page count in fallback mode
        info: {},
        metadata: {},
        version: '1.0',
        sections: sections
      };
    }
  } catch (error) {
    console.error('Error in advanced PDF text extraction:', error);
    // Return minimal result on error
    return {
      text: 'Error extracting text from PDF. The file may be corrupted or password-protected.',
      numpages: 0,
      info: {},
      metadata: {},
      version: '1.0',
      sections: {}
    };
  }
}

/**
 * Extract text from binary PDF by looking for text patterns
 * This is a fallback method for when other methods fail
 */
async function extractTextFromBinaryPDF(buffer: Buffer): Promise<string> {
  // This is a more aggressive approach to extract text from binary PDFs
  const decoder = new TextDecoder('utf-8');
  let extractedText = '';
  
  // Look for text chunks in the binary data
  // PDF text is often preceded by "BT" (Begin Text) and followed by "ET" (End Text)
  const data = new Uint8Array(buffer);
  
  // Search for readable text chunks
  let currentText = '';
  let inTextMode = false;
  
  for (let i = 0; i < data.length; i++) {
    // Check for text markers
    if (i < data.length - 1 && data[i] === 66 && data[i + 1] === 84) { // "BT"
      inTextMode = true;
      i += 2;
      continue;
    }
    
    if (i < data.length - 1 && data[i] === 69 && data[i + 1] === 84) { // "ET"
      inTextMode = false;
      if (currentText.length > 2) {
        extractedText += currentText + '\n';
      }
      currentText = '';
      i += 2;
      continue;
    }
    
    // In text mode, capture readable characters
    if (inTextMode) {
      const char = data[i];
      // ASCII printable range
      if (char >= 32 && char <= 126) {
        currentText += String.fromCharCode(char);
      } else if (char === 10 || char === 13) {
        currentText += '\n';
      }
    }
  }
  
  // Try to find text in the PDF stream data as a last resort
  if (extractedText.length < 500) {
    const stringData = decoder.decode(data);
    const textMatches = stringData.match(/(?:[(]\s*([A-Za-z0-9\s.,@-]+)\s*[)])/g) || [];
    
    extractedText += textMatches
      .map(m => m.replace(/^\(\s*|\s*\)$/g, ''))
      .filter(m => m.length > 3)
      .join(' ');
  }
  
  return extractedText.trim();
}

/**
 * Identify CV sections using common markers
 * @param text Full CV text
 * @returns Object with sections identified in the text
 */
function identifyCVSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n').map(line => line.trim());
  
  // Prepare regex patterns for each section (for more flexible matching)
  const sectionPatterns: Record<string, RegExp[]> = {};
  for (const [sectionKey, markers] of Object.entries(SECTION_MARKERS)) {
    sectionPatterns[sectionKey] = markers.map(marker => 
      new RegExp(`\\b${marker.replace(/\s+/g, '\\s+')}\\b`, 'i')
    );
  }
  
  // First, identify potential section headings and their line indices
  interface SectionMarker {
    name: string;
    index: number;
  }
  
  const sectionMarkers: SectionMarker[] = [];
  
  lines.forEach((line, index) => {
    if (line.length === 0) return;
    
    // Look for capitalized short lines that might be headings
    const isPotentialHeading = (
      (line.length < 50 && line.toUpperCase() === line) ||  // ALL CAPS
      (line.length < 50 && /^[A-Z]/.test(line)) ||         // Starts with capital
      (line.length < 50 && line.includes(':'))             // Contains colon
    );
    
    if (isPotentialHeading) {
      // Check if this line matches any of our section patterns
      for (const [sectionKey, patterns] of Object.entries(sectionPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            sectionMarkers.push({ name: sectionKey, index });
            break;
          }
        }
      }
    }
  });
  
  // Sort markers by their position in the document
  sectionMarkers.sort((a, b) => a.index - b.index);
  
  // Extract content between section markers
  for (let i = 0; i < sectionMarkers.length; i++) {
    const currentMarker = sectionMarkers[i];
    const nextMarker = sectionMarkers[i + 1];
    
    const startIndex = currentMarker.index + 1; // Start after the heading
    const endIndex = nextMarker ? nextMarker.index : lines.length;
    
    // Extract section content
    const sectionContent = lines.slice(startIndex, endIndex).join('\n').trim();
    
    // Store only if we have content
    if (sectionContent.length > 0) {
      sections[currentMarker.name] = sectionContent;
    }
  }
  
  // Special case: Personal information might be at the very top before any section
  if (sectionMarkers.length > 0 && sectionMarkers[0].index > 5) {
    const topContent = lines.slice(0, sectionMarkers[0].index).join('\n').trim();
    if (topContent.length > 0 && !sections.PERSONAL) {
      sections.PERSONAL = topContent;
    }
  }
  
  return sections;
}