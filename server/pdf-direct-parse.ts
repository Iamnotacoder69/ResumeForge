/**
 * A simpler PDF text extraction utility that focuses on extracting text
 * without relying on external parser libraries
 */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { PDFData } from './mock-pdf-parse';

// Convert fs functions to promises
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Extract text from PDF using direct buffer analysis
 * This is a simplified approach that parses the PDF buffer directly
 * 
 * @param pdfBuffer The PDF file as buffer
 * @returns Text extracted from the PDF and basic metadata
 */
export async function extractTextFromPDFBuffer(pdfBuffer: Buffer): Promise<PDFData> {
  try {
    // Convert buffer to string
    const pdfString = pdfBuffer.toString('utf8', 0, Math.min(pdfBuffer.length, 100000));
    
    // Extract text using regex patterns
    let text = extractTextContent(pdfString, pdfBuffer);
    
    // Count pages by looking for /Page objects
    const pageMatches = pdfString.match(/\/Type\s*\/Page/g);
    const pageCount = pageMatches ? pageMatches.length : 1;
    
    // Process and section the text
    const processedData = processCVText(text);
    
    return {
      text: processedData.text,
      numpages: pageCount,
      sections: processedData.sections
    };
  } catch (error) {
    console.error('Error extracting text from PDF buffer:', error);
    return {
      text: '',
      numpages: 0,
      sections: {}
    };
  }
}

/**
 * Extract text content from PDF string
 * Uses multiple approaches to maximize text extraction
 */
function extractTextContent(pdfString: string, pdfBuffer: Buffer): string {
  let extractedText = '';
  
  // Try to extract text between BT and ET markers (Basic Text objects)
  const textBlocks: string[] = [];
  const btEtRegex = /BT\s*(.*?)\s*ET/g;
  let match;
  
  while ((match = btEtRegex.exec(pdfString)) !== null) {
    if (match[1]) {
      // Extract text between parentheses
      const textInParens = match[1].match(/\((.*?)\)/g);
      if (textInParens) {
        textInParens.forEach(t => {
          // Remove parentheses and handle hex strings
          const cleaned = t.substring(1, t.length - 1).replace(/\\(\d{3})/g, (m, code) => {
            return String.fromCharCode(parseInt(code, 8));
          });
          textBlocks.push(cleaned);
        });
      }
      
      // Extract hex strings (text encoded as hex)
      const hexText = match[1].match(/<([0-9A-Fa-f]+)>/g);
      if (hexText) {
        hexText.forEach(h => {
          // Convert hex to ASCII
          const hex = h.substring(1, h.length - 1);
          let ascii = '';
          for (let i = 0; i < hex.length; i += 2) {
            ascii += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
          }
          textBlocks.push(ascii);
        });
      }
    }
  }
  
  // Look for clear text markers in the PDF
  const textStreamRegex = /stream\s*(.*?)\s*endstream/g;
  while ((match = textStreamRegex.exec(pdfString)) !== null) {
    if (match[1]) {
      // Filter to text-only streams
      if (!/image|stream|filter/i.test(match[0].substring(0, 100))) {
        // Decode any readable text content
        const decoded = match[1].replace(/\\n/g, '\n').replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t').replace(/\\(.)/g, '$1');
        
        // Only include if it looks like text content (contains spaces and common characters)
        if (/[a-zA-Z0-9\s.,;:]/.test(decoded) && decoded.length > 10) {
          textBlocks.push(decoded);
        }
      }
    }
  }
  
  // If we got some text, join it with newlines
  if (textBlocks.length > 0) {
    extractedText = textBlocks.join('\n');
  }
  
  // If standard approaches failed, try binary extraction
  if (extractedText.length < 100) {
    extractedText = extractFromBinaryPDF(pdfBuffer);
  }
  
  return extractedText;
}

/**
 * Extract text from binary PDF by looking for text patterns
 * This is a fallback method for when other methods fail
 */
function extractFromBinaryPDF(buffer: Buffer): string {
  // Convert buffer to string with various encodings and extract text markers
  const utf8Content = buffer.toString('utf8');
  const textBlocks: string[] = [];
  
  // Look for text between parentheses (common PDF text format)
  const parenthesisTexts = utf8Content.match(/\(([^\(\)]+)\)/g);
  if (parenthesisTexts) {
    parenthesisTexts.forEach(text => {
      const cleaned = text.substring(1, text.length - 1)
        .replace(/\\(\d{3})/g, (m, code) => String.fromCharCode(parseInt(code, 8)))
        .replace(/\\(.)/g, '$1');
      
      // Only include if it looks like real text (contains spaces, not just random chars)
      if (cleaned.length > 3 && /[a-zA-Z0-9]\s+[a-zA-Z0-9]/.test(cleaned)) {
        textBlocks.push(cleaned);
      }
    });
  }
  
  // Look for plain text sections that might be in the PDF
  const latinContent = buffer.toString('latin1');
  
  // Extract runs of printable ASCII characters
  const printableRuns = latinContent.match(/[A-Za-z0-9][A-Za-z0-9\s.,;:'\-!"#$%&*+\/=?^_`{|}~()[\]]{10,}[A-Za-z0-9.]/g);
  if (printableRuns) {
    printableRuns.forEach(run => {
      // Filter to likely text content
      if (/\s/.test(run) && run.length > 15 && !/^(%%|obj|endobj|stream|endstream|xref|trailer|startxref)/.test(run)) {
        textBlocks.push(run);
      }
    });
  }
  
  return textBlocks.join('\n');
}

/**
 * Process CV text to identify sections
 * @param text Raw text from PDF
 * @returns Processed text with identified sections
 */
function processCVText(text: string): { text: string, sections: Record<string, string> } {
  // Identify common CV section patterns
  const sectionPatterns = [
    { name: 'PERSONAL', patterns: ['personal information', 'contact information', 'contact details', 'personal details'] },
    { name: 'SUMMARY', patterns: ['professional summary', 'profile', 'summary', 'career objective', 'personal statement'] },
    { name: 'SKILLS', patterns: ['skills', 'competencies', 'key skills', 'expertise', 'technical skills', 'soft skills', 'core competencies'] },
    { name: 'EXPERIENCE', patterns: ['work experience', 'employment history', 'professional experience', 'career history', 'work history'] },
    { name: 'EDUCATION', patterns: ['education', 'academic background', 'educational background', 'qualifications', 'academic qualifications'] },
    { name: 'CERTIFICATIONS', patterns: ['certifications', 'certificates', 'professional certifications', 'accreditations'] },
    { name: 'LANGUAGES', patterns: ['languages', 'language proficiency', 'language skills'] },
    { name: 'ADDITIONAL', patterns: ['additional information', 'hobbies', 'interests', 'volunteer work', 'activities'] }
  ];
  
  // Object to store the identified sections
  const sections: Record<string, string> = {};
  
  // Split text into lines
  const lines = text.split('\n');
  
  // Check if we have enough content to process
  if (lines.length < 10) {
    return { text, sections: {} };
  }
  
  // Function to check if a line could be a section header
  const isSectionHeader = (line: string): { isHeader: boolean, sectionName: string } => {
    // Clean and lowercase the line for comparison
    const cleanLine = line.trim().toLowerCase();
    
    // Skip lines that are too long to be headers
    if (cleanLine.length > 50) {
      return { isHeader: false, sectionName: '' };
    }
    
    // Check if line matches any of our section patterns
    for (const section of sectionPatterns) {
      for (const pattern of section.patterns) {
        if (cleanLine.includes(pattern)) {
          return { isHeader: true, sectionName: section.name };
        }
      }
    }
    
    // Check for standalone headers (often just the word)
    if (sectionPatterns.some(section => 
      section.patterns.some(pattern => 
        cleanLine === pattern || 
        cleanLine === pattern + ':' || 
        cleanLine === pattern + 's')
    )) {
      return { isHeader: true, sectionName: sectionPatterns.find(section => 
        section.patterns.some(pattern => 
          cleanLine === pattern || 
          cleanLine === pattern + ':' || 
          cleanLine === pattern + 's')
      )!.name };
    }
    
    return { isHeader: false, sectionName: '' };
  };
  
  // Process the document to identify sections
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if this line is a section header
    const { isHeader, sectionName } = isSectionHeader(line);
    
    if (isHeader && sectionName) {
      // If we were already collecting a section, save it
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
        currentContent = [];
      }
      
      // Start a new section
      currentSection = sectionName;
    } else if (currentSection) {
      // Add this line to the current section content
      currentContent.push(line);
    } else {
      // If we haven't identified a section yet, this might be personal info
      if (!sections['PERSONAL']) {
        sections['PERSONAL'] = '';
      }
      
      if (sections['PERSONAL']) {
        sections['PERSONAL'] += '\n' + line;
      } else {
        sections['PERSONAL'] = line;
      }
    }
  }
  
  // Save the last section if we have one
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }
  
  // If we identified sections, format the text with section markers
  if (Object.keys(sections).length > 1) {
    // Format with section headings
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
    
    // Build a structured text representation
    let structuredText = "CV/RESUME CONTENT\n\n";
    
    // Add each section with clear headings
    for (const [sectionKey, content] of Object.entries(sections)) {
      if (content && content.trim().length > 0) {
        const title = sectionKey in sectionTitles ? sectionTitles[sectionKey] : sectionKey;
        structuredText += `### ${title} ###\n${content.trim()}\n\n`;
      }
    }
    
    console.log(`Successfully identified ${Object.keys(sections).length} CV sections`);
    return { text: structuredText.trim(), sections };
  }
  
  // If we couldn't identify sections, return the original text
  return { text, sections: {} };
}

/**
 * Extract text from a PDF file and save it to a text file
 * @param pdfPath Path to the PDF file
 * @returns Path to the created text file
 */
export async function convertPDFtoText(pdfPath: string): Promise<string> {
  try {
    console.log(`Converting PDF to text directly: ${path.basename(pdfPath)}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath);
    
    // Extract text and sections from PDF
    const result = await extractTextFromPDFBuffer(pdfBuffer);
    
    // Create a unique hash for the filename to avoid collisions
    const fileHash = Math.random().toString(36).substring(2, 15);
    const textFilePath = path.join(tempDir, `${fileHash}.txt`);
    
    // Write the processed text to a file
    await writeFile(textFilePath, result.text);
    
    console.log('PDF converted to text file successfully');
    
    return textFilePath;
  } catch (error: unknown) {
    console.error('Error converting PDF to text:', error);
    throw new Error(`Failed to convert PDF to text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}