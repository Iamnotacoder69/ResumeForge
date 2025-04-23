/**
 * Advanced PDF text extraction utility specifically optimized for CV/resume parsing
 */

import { PDFDocument } from 'pdf-lib';
import { PDFData } from './pdf-wrapper';

// CV/Resume common section markers (case insensitive)
const SECTION_MARKERS = {
  PERSONAL: ['personal information', 'personal details', 'contact', 'contact information', 'profile', 'about me', 'personal data', 'personal profile', 'personal', 'contact details'],
  SUMMARY: ['summary', 'professional summary', 'career objective', 'objective', 'about me', 'profile', 'professional profile', 'career summary', 'executive summary', 'overview', 'professional overview', 'career profile', 'personal statement'],
  SKILLS: ['skills', 'technical skills', 'core skills', 'competencies', 'key skills', 'expertise', 'technologies', 'qualifications', 'professional skills', 'key competencies', 'skills & abilities', 'core competencies', 'areas of expertise', 'strengths', 'key strengths', 'technical expertise', 'skills and competencies'],
  EXPERIENCE: ['experience', 'work experience', 'employment history', 'professional experience', 'work history', 'career history', 'relevant experience', 'professional background', 'employment', 'work', 'career', 'job experience', 'job history', 'positions held', 'employment experience', 'professional history'],
  EDUCATION: ['education', 'academic', 'qualifications', 'academic background', 'educational background', 'educational qualifications', 'academic qualifications', 'academic history', 'education & training', 'education and qualifications', 'academic credentials', 'educational history'],
  CERTIFICATIONS: ['certifications', 'certificates', 'professional certifications', 'qualifications', 'courses', 'professional development', 'training', 'accreditation', 'credentials', 'diplomas', 'professional qualifications', 'licenses', 'technical certifications', 'certification'],
  LANGUAGES: ['languages', 'language skills', 'language proficiency', 'foreign languages', 'linguistic abilities', 'spoken languages', 'language knowledge', 'language competencies', 'language and communication'],
  ADDITIONAL: ['additional', 'additional information', 'interests', 'hobbies', 'volunteer', 'activities', 'personal interests', 'extracurricular', 'other activities', 'volunteer experience', 'community service', 'achievements', 'awards', 'references', 'publications', 'projects', 'personal activities']
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
      console.log(`PDF document loaded successfully with ${pageCount} pages`);
      
      // Try multiple approaches and use the best result
      
      // Approach 1: Extract text from buffer using UTF-8
      console.log(`Trying UTF-8 raw extraction approach`);
      const rawText = buffer.toString('utf-8', 0, buffer.length);
      let utf8Text = '';
      
      if (rawText.length > 500) {
        // Clean up the raw text - remove non-printable characters but preserve newlines
        utf8Text = rawText.replace(/[^\x20-\x7E\r\n\t]/g, ' ')
                      .replace(/\s{3,}/g, '\n') // Multiple spaces might be paragraph breaks
                      .trim();
        
        console.log(`Extracted ${utf8Text.length} characters via UTF-8 method`);
      }
      
      // Approach 2: Try binary extraction method
      console.log(`Trying binary extraction approach`);
      const binaryText = await extractTextFromBinaryPDF(buffer);
      console.log(`Extracted ${binaryText.length} characters via binary method`);
      
      // Use the approach that yielded more text
      if (utf8Text.length > binaryText.length && utf8Text.length > 500) {
        text = utf8Text;
        console.log(`Using UTF-8 extraction approach (${text.length} chars)`);
      } else if (binaryText.length > 0) {
        text = binaryText;
        console.log(`Using binary extraction approach (${text.length} chars)`);
      } else {
        // Both approaches failed, try a last-ditch effort with a different encoding
        const latinText = buffer.toString('latin1', 0, buffer.length)
          .replace(/[^\x20-\x7E\r\n\t]/g, ' ')
          .replace(/\s{3,}/g, '\n')
          .trim();
        
        text = latinText;
        console.log(`Using Latin-1 fallback extraction (${text.length} chars)`);
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
  
  // APPROACH 1: Search for readable text chunks between text markers
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
  
  // APPROACH 2: Extract text in PDF stream objects (typical format: "(...text...)")
  const stringData = decoder.decode(data);
  
  // Match text in parentheses that might be text content
  // First pattern: Look for standard text in PDF stream objects
  let textMatches = stringData.match(/(?:[(]\s*([A-Za-z0-9\s.,@\-_:;'"]+)\s*[)])/g) || [];
  
  // Enhanced approach for potential email addresses and structured data
  const emailMatches = stringData.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const dateMatches = stringData.match(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g) || [];
  
  // Extract coherent words and phrases (3+ letters)
  const wordMatches = stringData.match(/\b[A-Za-z]{3,}\b/g) || [];
  
  // Combine and clean up the extracted text
  let streamText = textMatches
    .map(m => m.replace(/^\(\s*|\s*\)$/g, ''))
    .filter(m => m.length > 3)
    .join(' ');
  
  // Add extracted emails and dates
  if (emailMatches.length > 0) {
    streamText += '\nEmails: ' + emailMatches.join(', ') + '\n';
  }
  
  if (dateMatches.length > 0) {
    streamText += '\nDates: ' + dateMatches.join(', ') + '\n';
  }
  
  // If we still have very little text, try the word extraction approach
  if ((extractedText.length + streamText.length) < 300 && wordMatches.length > 50) {
    streamText += '\n' + wordMatches.join(' ');
  }
  
  // Combine all approaches
  extractedText += (extractedText ? '\n\n' : '') + streamText;
  
  console.log(`Binary PDF extraction retrieved ${extractedText.length} total characters`);
  
  return extractedText.trim();
}

/**
 * Identify CV sections using common markers
 * @param text Full CV text
 * @returns Object with sections identified in the text
 */
export function identifyCVSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n').map(line => line.trim());
  
  console.log(`Analyzing ${lines.length} lines of text to identify CV sections`);
  
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
    strength: number; // How confident we are that this is a section heading
  }
  
  const sectionMarkers: SectionMarker[] = [];
  
  lines.forEach((line, index) => {
    if (line.length === 0) return;
    
    // Check if the line has any section markers
    let foundMarker = false;
    
    // Look for capitalized short lines that might be headings
    const isAllCaps = line.length < 50 && line.toUpperCase() === line;
    const isCapitalized = line.length < 50 && /^[A-Z]/.test(line);
    const hasColon = line.includes(':');
    const hasBoldIndicator = line.includes('**') || line.includes('__');
    const isShortLine = line.length < 30;
    
    // Calculate a strength score based on formatting clues
    let headingStrength = 0;
    if (isAllCaps) headingStrength += 3;
    if (isCapitalized) headingStrength += 1;
    if (hasColon) headingStrength += 2;
    if (hasBoldIndicator) headingStrength += 2;
    if (isShortLine) headingStrength += 1;
    
    // Check if this line matches any of our section patterns
    for (const [sectionKey, patterns] of Object.entries(sectionPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(line)) {
          sectionMarkers.push({ 
            name: sectionKey, 
            index,
            strength: headingStrength + 2 // Add 2 for matching a known section title pattern
          });
          foundMarker = true;
          break;
        }
      }
      if (foundMarker) break;
    }
    
    // Even if we didn't find a specific marker, add potential headings with strength above threshold
    if (!foundMarker && headingStrength >= 4) {
      // Try to determine the type of heading based on content
      let bestMatch: { key: string, score: number } = { key: 'ADDITIONAL', score: 0 };
      
      for (const [sectionKey, markers] of Object.entries(SECTION_MARKERS)) {
        // Check how many marker words match with this line
        const keyWords = markers.flatMap(m => m.toLowerCase().split(/\s+/));
        const lineWords = line.toLowerCase().split(/\s+/);
        
        const matchCount = keyWords.filter(word => 
          lineWords.some(lineWord => lineWord.includes(word))
        ).length;
        
        if (matchCount > bestMatch.score) {
          bestMatch = { key: sectionKey, score: matchCount };
        }
      }
      
      if (bestMatch.score > 0) {
        sectionMarkers.push({
          name: bestMatch.key,
          index,
          strength: headingStrength
        });
      }
    }
  });
  
  // Sort markers by their position in the document
  sectionMarkers.sort((a, b) => a.index - b.index);
  
  // Remove duplicate or overlapping sections by taking the stronger match
  const filteredMarkers: SectionMarker[] = [];
  for (let i = 0; i < sectionMarkers.length; i++) {
    const current = sectionMarkers[i];
    const next = sectionMarkers[i + 1];
    
    // If the next marker is very close (within 1-2 lines), take the stronger one
    if (next && (next.index - current.index <= 2)) {
      if (current.strength >= next.strength) {
        filteredMarkers.push(current);
        i++; // Skip the next one
      } else {
        // Skip current, keep next
        continue;
      }
    } else {
      filteredMarkers.push(current);
    }
  }
  
  console.log(`Identified ${filteredMarkers.length} potential CV section headers`);
  
  // Extract content between section markers
  for (let i = 0; i < filteredMarkers.length; i++) {
    const currentMarker = filteredMarkers[i];
    const nextMarker = filteredMarkers[i + 1];
    
    const startIndex = currentMarker.index + 1; // Start after the heading
    const endIndex = nextMarker ? nextMarker.index : lines.length;
    
    // Extract section content
    const sectionContent = lines.slice(startIndex, endIndex).join('\n').trim();
    
    // Store only if we have content
    if (sectionContent.length > 0) {
      sections[currentMarker.name] = sectionContent;
      console.log(`Added section ${currentMarker.name} with ${sectionContent.length} chars`);
    }
  }
  
  // Special case: Personal information might be at the very top before any section
  if (filteredMarkers.length > 0 && filteredMarkers[0].index > 5) {
    const topContent = lines.slice(0, filteredMarkers[0].index).join('\n').trim();
    if (topContent.length > 0 && !sections.PERSONAL) {
      sections.PERSONAL = topContent;
      console.log(`Added PERSONAL section from document top (${topContent.length} chars)`);
    }
  }
  
  // If we couldn't find ANY sections, try a content-based approach as a last resort
  if (Object.keys(sections).length === 0) {
    console.log("No sections found using heading detection, trying content-based approach");
    
    // Use common patterns in the content to identify sections
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
    
    if (emailMatch || phoneMatch) {
      // Find a chunk of text around contact info for the personal section
      const contactIndex = emailMatch ? text.indexOf(emailMatch[0]) : text.indexOf(phoneMatch![0]);
      const startIndex = Math.max(0, contactIndex - 100);
      const endIndex = Math.min(text.length, contactIndex + 200);
      
      sections.PERSONAL = text.substring(startIndex, endIndex);
      console.log(`Added PERSONAL section using contact info detection`);
    }
    
    // Look for education keywords
    if (text.match(/\b(degree|university|college|bachelor|master|phd|diploma|graduated)\b/i)) {
      const eduMatch = text.match(/\b(degree|university|college|bachelor|master|phd|diploma|graduated)\b/i);
      if (eduMatch) {
        const eduIndex = text.indexOf(eduMatch[0]);
        const startIndex = Math.max(0, eduIndex - 50);
        const endIndex = Math.min(text.length, eduIndex + 300);
        
        sections.EDUCATION = text.substring(startIndex, endIndex);
        console.log(`Added EDUCATION section using keyword detection`);
      }
    }
    
    // Look for experience keywords
    if (text.match(/\b(experience|work|employment|job|position|career|company)\b/i)) {
      const expMatch = text.match(/\b(experience|work|employment|job|position|career|company)\b/i);
      if (expMatch) {
        const expIndex = text.indexOf(expMatch[0]);
        const startIndex = Math.max(0, expIndex - 50);
        const endIndex = Math.min(text.length, expIndex + 500);
        
        sections.EXPERIENCE = text.substring(startIndex, endIndex);
        console.log(`Added EXPERIENCE section using keyword detection`);
      }
    }
  }
  
  return sections;
}