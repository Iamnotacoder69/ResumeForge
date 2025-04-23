import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import pdfParse from 'pdf-parse';
import { PDFData } from './mock-pdf-parse';
import { exists, mkdir } from 'fs/promises';

// Convert fs functions to promises
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Extract text directly from a PDF file and save it to a text file
 * This approach uses pdf-parse to get the raw text content
 * @param pdfPath Path to the PDF file
 * @returns Path to the created text file
 */
export async function convertPDFtoText(pdfPath: string): Promise<string> {
  try {
    console.log(`Converting PDF to text: ${path.basename(pdfPath)}`);
    
    // Ensure temp directory exists
    const tempDir = path.join(process.cwd(), 'temp');
    if (!(await exists(tempDir))) {
      await mkdir(tempDir, { recursive: true });
    }
    
    // Read the PDF file
    const pdfBuffer = await readFile(pdfPath);
    
    // Parse the PDF to extract text
    const data = await pdfParse(pdfBuffer);
    
    // Create a unique hash for the filename to avoid collisions
    const fileHash = Math.random().toString(36).substring(2, 15);
    const textFilePath = path.join(tempDir, `${fileHash}.txt`);
    
    // Process the text - identify sections if possible
    const processedData = await processPDFText(data.text);
    
    // Write the processed text to a file
    await writeFile(textFilePath, processedData);
    
    console.log('PDF converted to text file successfully');
    
    return textFilePath;
  } catch (error: unknown) {
    console.error('Error converting PDF to text:', error);
    throw new Error(`Failed to convert PDF to text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process raw PDF text to identify sections and improve structure
 * @param text Raw text extracted from PDF
 * @returns Processed text with sections identified where possible
 */
async function processPDFText(text: string): Promise<string> {
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
  
  // Convert text to lines
  const lines = text.split('\n');
  
  // Check if we have enough content to process
  if (lines.length < 10) {
    return text; // Not enough content to process meaningfully
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
  
  // If we identified sections, format the text with section markers for better OpenAI analysis
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
    return structuredText.trim();
  }
  
  // If we couldn't identify sections, return the original text
  return text;
}

/**
 * Extract data from a PDF including text and identified sections
 * @param pdfBuffer PDF file as buffer
 * @returns Extracted data with both full text and identified sections
 */
export async function extractDataFromPDF(pdfBuffer: Buffer): Promise<PDFData> {
  try {
    // Parse the PDF to extract text
    const data = await pdfParse(pdfBuffer);
    
    // Process the text to identify sections
    const processedText = await processPDFText(data.text);
    
    // Extract sections from the processed text
    const sections: Record<string, string> = {};
    
    // If the processed text has section markers, parse them
    if (processedText.includes('### ')) {
      const sectionPattern = /### ([A-Z &]+) ###\n([\s\S]*?)(?=\n### |$)/g;
      let match;
      
      while ((match = sectionPattern.exec(processedText)) !== null) {
        const sectionName = match[1].trim();
        const sectionContent = match[2].trim();
        
        // Convert section name to our standard format
        let standardName = '';
        if (sectionName.includes('PERSONAL')) standardName = 'PERSONAL';
        else if (sectionName.includes('SUMMARY')) standardName = 'SUMMARY';
        else if (sectionName.includes('SKILLS') || sectionName.includes('COMPETENCIES')) standardName = 'SKILLS';
        else if (sectionName.includes('EXPERIENCE') || sectionName.includes('EMPLOYMENT')) standardName = 'EXPERIENCE';
        else if (sectionName.includes('EDUCATION')) standardName = 'EDUCATION';
        else if (sectionName.includes('CERTIFICATION')) standardName = 'CERTIFICATIONS';
        else if (sectionName.includes('LANGUAGE')) standardName = 'LANGUAGES';
        else standardName = 'ADDITIONAL';
        
        sections[standardName] = sectionContent;
      }
    }
    
    return {
      text: data.text,
      numpages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version,
      sections: Object.keys(sections).length > 0 ? sections : undefined
    };
  } catch (error) {
    console.error('Error extracting data from PDF:', error);
    return {
      text: '',
      numpages: 0,
      sections: {}
    };
  }
}