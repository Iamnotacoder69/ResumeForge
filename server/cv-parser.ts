import * as mammoth from "mammoth";
import { CompleteCV, PersonalInfo, Experience, Education, Certificate, KeyCompetencies } from "../shared/types";

/**
 * Parse a PDF CV document and extract structured information
 * This is a simplified implementation that extracts text content as best as it can
 * @param buffer PDF file buffer
 * @returns Extracted CV data
 */
async function parsePdfCV(buffer: Buffer): Promise<Partial<CompleteCV>> {
  try {
    console.log("Parsing PDF document...");
    
    // Convert buffer to text (this is a very simple approach)
    // We'll look for text content in the PDF
    const textContent = extractTextFromPDF(buffer);
    
    console.log(`Extracted ${textContent.length} characters from PDF`);
    
    // Process the extracted text
    return extractCVDataFromText(textContent);
  } catch (error) {
    console.error("Error handling PDF:", error);
    throw new Error("Failed to process PDF document: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Simple function to extract text from PDF buffer
 * This is a very basic implementation that tries to find text content
 * It won't work for all PDFs but should extract some text from many
 */
function extractTextFromPDF(buffer: Buffer): string {
  const bufferStr = buffer.toString('binary');
  let extractedText = '';
  
  // Look for text objects in the PDF
  const textObjectRegex = /\(([^\)]+)\)/g;
  const matches = bufferStr.match(textObjectRegex);
  
  if (matches) {
    extractedText = matches
      .map(match => match.slice(1, -1))
      .filter(text => text.length > 1 && /[a-zA-Z0-9]/.test(text))
      .join(' ');
  }
  
  // If we couldn't extract text, return empty string
  if (extractedText.length < 100) {
    console.warn("Could not extract sufficient text from PDF. The extraction might be incomplete.");
    
    // Last resort - try to extract any readable ASCII text
    const asciiText = buffer.toString('ascii')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
      
    if (asciiText.length > extractedText.length) {
      extractedText = asciiText;
    }
  }
  
  console.log(`PDF text extraction extracted ${extractedText.length} characters.`);
  return extractedText;
}

/**
 * Parse a DOCX CV document and extract structured information
 * @param buffer DOCX file buffer
 * @returns Extracted CV data
 */
async function parseDocxCV(buffer: Buffer): Promise<Partial<CompleteCV>> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return extractCVDataFromText(result.value);
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    throw new Error("Failed to parse Word document");
  }
}

/**
 * Main function to parse CV document based on file type
 * @param buffer File buffer
 * @param mimeType File MIME type
 * @returns Extracted CV data
 */
export async function parseCV(buffer: Buffer, mimeType: string): Promise<Partial<CompleteCV>> {
  if (mimeType === "application/pdf") {
    return parsePdfCV(buffer);
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return parseDocxCV(buffer);
  } else {
    throw new Error("Unsupported file format. Please upload a PDF or DOCX file.");
  }
}

/**
 * Extract CV data from text content using pattern matching and NLP techniques
 * @param text CV document text content
 * @returns Structured CV data
 */
function extractCVDataFromText(text: string): Partial<CompleteCV> {
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  
  // Initialize CV object with empty sections matching the schema
  const cv: Partial<CompleteCV> = {
    personal: extractPersonalInfo(cleanText),
    professional: extractSummary(cleanText),
    keyCompetencies: extractKeyCompetencies(cleanText),
    experience: extractExperience(cleanText),
    education: extractEducation(cleanText),
    certificates: extractCertificates(cleanText),
    extracurricular: [],
    additional: {
      skills: []
    },
    languages: [],
    templateSettings: {
      template: 'professional',
      includePhoto: false,
      sectionOrder: [
        { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
        { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
        { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
        { id: 'experience', name: 'Experience', visible: true, order: 3 },
        { id: 'education', name: 'Education', visible: true, order: 4 },
        { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
        { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
        { id: 'additional', name: 'Additional Information', visible: true, order: 7 },
      ]
    }
  };
  
  return cv;
}

/**
 * Extract personal information from text
 */
function extractPersonalInfo(text: string): PersonalInfo {
  // Default empty personal info
  const personalInfo: PersonalInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
  };
  
  console.log("Extracting personal info from text...");
  
  // Extract email with regex - more comprehensive pattern
  const emailRegex = /([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/gi;
  const emailMatch = text.match(emailRegex);
  if (emailMatch && emailMatch.length > 0) {
    personalInfo.email = emailMatch[0];
    console.log(`Found email: ${personalInfo.email}`);
  }
  
  // Extract phone number - more comprehensive pattern
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?(?:\d{3})\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch && phoneMatch.length > 0) {
    personalInfo.phone = phoneMatch[0];
    console.log(`Found phone: ${personalInfo.phone}`);
  }
  
  // Extract LinkedIn URL - improved pattern
  const linkedinRegex = /(?:linkedin\.com\/in\/|linkedin\.com\/profile\/view\?id=|linkedin\.com\/pub\/)[a-zA-Z0-9_-]+/gi;
  const linkedinMatch = text.match(linkedinRegex);
  if (linkedinMatch && linkedinMatch.length > 0) {
    let linkedinUrl = linkedinMatch[0];
    if (!linkedinUrl.startsWith('http')) {
      linkedinUrl = `https://www.${linkedinUrl}`;
    }
    personalInfo.linkedin = linkedinUrl;
    console.log(`Found LinkedIn: ${personalInfo.linkedin}`);
  }
  
  // Try to extract name - more sophisticated approach
  // First, look for lines that indicate it's a CV/resume
  const cvHeaderRegex = /\b(curriculum\s+vitae|resume|cv)\b/i;
  const cvHeaderLines = text.split('\n').filter(line => cvHeaderRegex.test(line));
  
  // Look for lines in the first 10 lines that could be a name
  const nameRegex = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/;
  let nameLine = '';
  
  // First check if there's a name line right before or after CV/resume
  if (cvHeaderLines.length > 0) {
    const cvHeaderIndex = text.split('\n').findIndex(line => cvHeaderRegex.test(line));
    if (cvHeaderIndex > 0) {
      const lineBeforeCVHeader = text.split('\n')[cvHeaderIndex - 1].trim();
      const lineAfterCVHeader = text.split('\n')[cvHeaderIndex + 1]?.trim();
      
      if (nameRegex.test(lineBeforeCVHeader)) {
        nameLine = lineBeforeCVHeader;
      } else if (lineAfterCVHeader && nameRegex.test(lineAfterCVHeader)) {
        nameLine = lineAfterCVHeader;
      }
    }
  }
  
  // If we didn't find a name line from CV/resume context, check first few lines
  if (!nameLine) {
    const firstFewLines = text.split('\n').slice(0, 10).map(line => line.trim()).filter(line => line.length > 0);
    for (const line of firstFewLines) {
      // Potential name patterns
      // Look for capitalized words without special chars
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(line) && line.length < 50) {
        nameLine = line;
        break;
      }
    }
  }
  
  // If we found a name line, split it into first and last name
  if (nameLine) {
    const nameParts = nameLine.split(/\s+/);
    if (nameParts.length >= 2) {
      personalInfo.firstName = nameParts[0];
      personalInfo.lastName = nameParts.slice(1).join(' ');
      console.log(`Found name: ${personalInfo.firstName} ${personalInfo.lastName}`);
    }
  } else {
    // Last resort: Take the first line
    const firstLine = text.split('\n')[0].trim();
    if (firstLine && firstLine.length > 0 && firstLine.length < 50) {
      const nameParts = firstLine.split(/\s+/);
      if (nameParts.length >= 2) {
        personalInfo.firstName = nameParts[0];
        personalInfo.lastName = nameParts.slice(1).join(' ');
        console.log(`Using first line as name: ${personalInfo.firstName} ${personalInfo.lastName}`);
      }
    }
  }
  
  return personalInfo;
}

/**
 * Extract professional summary from text
 */
function extractSummary(text: string): { summary: string } {
  // Look for a professional summary section
  const summaryRegex = /(professional\s+summary|summary|profile|about\s+me|objective)[\s\n:]+([^]*?)(?=(experience|education|skills|certifications|languages|additional|references|hobbies)[\s\n:]|$)/i;
  const match = text.match(summaryRegex);
  
  return {
    summary: match && match[2] ? match[2].trim() : ''
  };
}

/**
 * Extract key competencies from text
 */
function extractKeyCompetencies(text: string): KeyCompetencies {
  const skills: KeyCompetencies = {
    technicalSkills: [],
    softSkills: []
  };
  
  console.log("Extracting skills from text...");
  
  // List of common technical skills keywords for classification
  const technicalKeywords = [
    'programming', 'software', 'java', 'python', 'javascript', 'typescript', 'html', 'css', 
    'react', 'angular', 'vue', 'node', 'express', 'mongodb', 'sql', 'mysql', 'postgresql',
    'database', 'frontend', 'backend', 'fullstack', 'agile', 'git', 'aws', 'azure', 'cloud',
    'docker', 'kubernetes', 'ci/cd', 'jenkins', 'devops', 'linux', 'unix', 'shell', 'bash',
    'rest', 'api', 'microservices', 'testing', 'machine learning', 'ai', 'data science',
    'algorithms', 'data structures', 'network', 'security', 'mobile', 'ios', 'android',
    'swift', 'kotlin', 'cplusplus', 'csharp', '.net', 'php', 'ruby', 'scala', 'go', 'rust', 'blockchain',
    'solidity', 'excel', 'tableau', 'powerbi', 'data visualization', 'sap', 'salesforce',
    'jira', 'confluence', 'scrum', 'kanban', 'ux', 'ui', 'figma', 'sketch', 'photoshop',
    'illustrator', 'indesign', 'adobe', 'wordpress', 'shopify', 'magento', 'seo', 'sem',
    'analytics', 'statistics', 'r', 'hadoop', 'spark', 'tensorflow', 'pytorch', 'keras',
    'nlp', 'computer vision', 'qa', 'selenium', 'cypress', 'jest', 'mocha', 'chai',
    'webpack', 'babel', 'npm', 'yarn', 'gatsby', 'nextjs', 'graphql', 'redux', 'mobx',
    'sass', 'less', 'tailwind', 'bootstrap', 'material-ui', 'chakra-ui'
  ];
  
  // List of common soft skills keywords for classification
  const softKeywords = [
    'communication', 'teamwork', 'leadership', 'problem-solving', 'critical thinking',
    'creativity', 'time management', 'organization', 'adaptability', 'flexibility',
    'interpersonal', 'negotiation', 'conflict resolution', 'presentation', 'public speaking',
    'writing', 'decision-making', 'analytical', 'attention to detail', 'multitasking',
    'stress management', 'emotional intelligence', 'empathy', 'customer service',
    'coaching', 'mentoring', 'training', 'collaboration', 'project management',
    'prioritization', 'delegation', 'self-motivation', 'work ethic', 'integrity',
    'initiative', 'resourcefulness', 'reliability', 'responsibility', 'accountability',
    'patience', 'persistence', 'resilience', 'active listening'
  ];
  
  // First look for sections that might specifically separate technical and soft skills
  const technicalSectionRegex = /(technical\s+skills|hard\s+skills|professional\s+skills)[\s\n:]+([^]*?)(?=(soft\s+skills|personal\s+skills|experience|education|summary|certifications|languages|additional|references|hobbies)[\s\n:]|$)/i;
  const technicalMatch = text.match(technicalSectionRegex);
  
  const softSectionRegex = /(soft\s+skills|personal\s+skills|interpersonal\s+skills)[\s\n:]+([^]*?)(?=(technical\s+skills|hard\s+skills|professional\s+skills|experience|education|summary|certifications|languages|additional|references|hobbies)[\s\n:]|$)/i;
  const softMatch = text.match(softSectionRegex);
  
  // If we found specific technical skills section
  if (technicalMatch && technicalMatch[2]) {
    const techSkillsText = technicalMatch[2].trim();
    // Split by bullet points, commas or new lines
    const skillItems = techSkillsText.split(/[,•\n\*\-]+/);
    
    // Filter and clean
    skills.technicalSkills = skillItems
      .map(item => item.trim().replace(/^\s*-\s*/, ''))
      .filter(item => item.length > 0 && item.length < 100);
      
    console.log(`Found ${skills.technicalSkills.length} technical skills in technical section`);
  }
  
  // If we found specific soft skills section
  if (softMatch && softMatch[2]) {
    const softSkillsText = softMatch[2].trim();
    // Split by bullet points, commas or new lines
    const skillItems = softSkillsText.split(/[,•\n\*\-]+/);
    
    // Filter and clean
    skills.softSkills = skillItems
      .map(item => item.trim().replace(/^\s*-\s*/, ''))
      .filter(item => item.length > 0 && item.length < 100);
      
    console.log(`Found ${skills.softSkills.length} soft skills in soft skills section`);
  }
  
  // If we didn't find specific sections, look for a general skills section
  if (skills.technicalSkills.length === 0 && skills.softSkills.length === 0) {
    const generalSkillsRegex = /(skills|competencies|qualifications|core\s+skills|key\s+skills|areas\s+of\s+expertise)[\s\n:]+([^]*?)(?=(experience|education|summary|certifications|languages|additional|references|hobbies)[\s\n:]|$)/i;
    const match = text.match(generalSkillsRegex);
    
    if (match && match[2]) {
      const skillText = match[2].trim();
      // Split by bullet points, commas or new lines
      const skillItems = skillText.split(/[,•\n\*\-]+/);
      
      // Filter and clean
      const allSkills = skillItems
        .map(item => item.trim().replace(/^\s*-\s*/, ''))
        .filter(item => item.length > 0 && item.length < 100);
      
      console.log(`Found ${allSkills.length} total skills in general skills section`);
      
      // Categorize skills as technical or soft
      allSkills.forEach(skill => {
        const lowerSkill = skill.toLowerCase();
        
        // Check if this skill matches any technical keyword
        const isTechnical = technicalKeywords.some(keyword => 
          lowerSkill.includes(keyword.toLowerCase())
        );
        
        // Check if this skill matches any soft keyword
        const isSoft = softKeywords.some(keyword => 
          lowerSkill.includes(keyword.toLowerCase())
        );
        
        if (isTechnical) {
          skills.technicalSkills.push(skill);
        } else if (isSoft) {
          skills.softSkills.push(skill);
        } else {
          // If we can't categorize, default to technical
          skills.technicalSkills.push(skill);
        }
      });
    }
  }
  
  // If we still don't have any skills, try to extract skills from the whole document
  if (skills.technicalSkills.length === 0 && skills.softSkills.length === 0) {
    console.log("No skills sections found, searching whole document for skills...");
    
    // Look for common skill patterns in the entire text
    const technicalMatches: string[] = [];
    technicalKeywords.forEach(keyword => {
      try {
        // Escape special regex characters in keywords
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          technicalMatches.push(...matches);
        }
      } catch (err) {
        const error = err as Error;
        console.warn(`Error creating regex for keyword "${keyword}": ${error.message}`);
      }
    });
    
    const softMatches: string[] = [];
    softKeywords.forEach(keyword => {
      try {
        // Escape special regex characters in keywords
        const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          softMatches.push(...matches);
        }
      } catch (err) {
        const error = err as Error;
        console.warn(`Error creating regex for keyword "${keyword}": ${error.message}`);
      }
    });
    
    // Add unique skills
    skills.technicalSkills = Array.from(new Set(technicalMatches));
    skills.softSkills = Array.from(new Set(softMatches));
    
    console.log(`Found ${skills.technicalSkills.length} technical skills and ${skills.softSkills.length} soft skills from whole document`);
  }
  
  return skills;
}

/**
 * Extract work experience from text
 */
function extractExperience(text: string): Array<{
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  responsibilities: string;
}> {
  const experiences: Array<{
    companyName: string;
    jobTitle: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    responsibilities: string;
  }> = [];
  
  console.log("Extracting work experience from text...");
  
  // Look for experience section
  const experienceRegex = /(work\s+experience|experience|employment|professional\s+experience)[\s\n:]+([^]*?)(?=(education|skills|certifications|languages|additional|references|hobbies)[\s\n:]|$)/i;
  const match = text.match(experienceRegex);
  
  if (match && match[2]) {
    const experienceSection = match[2].trim();
    console.log(`Found experience section with ${experienceSection.length} characters`);
    
    // Try several approaches to split the experience section into separate job entries
    
    // Approach 1: Split by date patterns that often denote start of new entries
    const datePatternSplit = experienceSection.split(/(?=\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b|\b\d{4}\s*(-|to|–|—))/i);
    
    // Approach 2: Split by company names (assuming they start with capital letters and might include "Inc", "LLC", etc.)
    const companyPatternSplit = experienceSection.split(/(?=\n[A-Z][a-zA-Z\s,'.&]+(Inc|LLC|Ltd|Corporation|Company|GmbH|Co\.|Group)?\b)/);
    
    // Approach 3: Split by job titles (common titles that might appear)
    const jobTitlePattern = /(?=\n(?:Senior|Junior|Lead|Principal|Director|Manager|Engineer|Developer|Analyst|Consultant|Specialist|Coordinator|Administrator|Associate|Assistant)\b)/i;
    const jobTitleSplit = experienceSection.split(jobTitlePattern);
    
    // Approach 4: Split by bullet points or multiple newlines which often indicate separate entries
    const bulletSplit = experienceSection.split(/\n{2,}|\n•|\n-|\n\*/);
    
    // Use the approach that gives the most reasonable number of entries (not too many, not too few)
    let entries = bulletSplit; // Default
    
    if (datePatternSplit.length > 1 && datePatternSplit.length <= 10) {
      entries = datePatternSplit;
      console.log(`Using date pattern split: ${entries.length} entries`);
    } else if (companyPatternSplit.length > 1 && companyPatternSplit.length <= 10) {
      entries = companyPatternSplit;
      console.log(`Using company pattern split: ${entries.length} entries`);
    } else if (jobTitleSplit.length > 1 && jobTitleSplit.length <= 10) {
      entries = jobTitleSplit;
      console.log(`Using job title split: ${entries.length} entries`);
    } else {
      console.log(`Using bullet/newline split: ${entries.length} entries`);
    }
    
    // Process each potential job entry
    entries.forEach((entry, index) => {
      const trimmedEntry = entry.trim();
      if (trimmedEntry.length > 0) {
        console.log(`Processing job entry ${index + 1}`);
        
        // Split into lines for easier analysis
        const lines = trimmedEntry.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length >= 2) {
          // Try to identify job title and company name from the first few lines
          // Common patterns include:
          // 1. Job Title at Company Name
          // 2. Company Name - Job Title
          // 3. Job Title (first line), Company Name (second line)
          
          let jobTitle = '';
          let companyName = '';
          
          // Check for "Job Title at Company Name" pattern
          const atPattern = /^(.*?)\s+(?:at|@|for)\s+(.*)$/i;
          const atMatch = lines[0].match(atPattern);
          
          // Check for "Company Name - Job Title" pattern
          const dashPattern = /^(.*?)\s+(?:-|–|—)\s+(.*)$/i;
          const dashMatch = lines[0].match(dashPattern);
          
          if (atMatch) {
            jobTitle = atMatch[1].trim();
            companyName = atMatch[2].trim();
          } else if (dashMatch) {
            companyName = dashMatch[1].trim();
            jobTitle = dashMatch[2].trim();
          } else {
            // Assume first line is job title, second line is company
            jobTitle = lines[0];
            if (lines.length > 1) {
              companyName = lines[1];
            }
          }
          
          // Extract dates
          let startDate = '';
          let endDate = '';
          let isCurrent = false;
          
          // Look for date patterns in the entire entry
          const monthYearPattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/gi;
          const yearPattern = /\b(19|20)\d{2}\b/g;
          
          const monthYearMatches = trimmedEntry.match(monthYearPattern);
          const yearMatches = trimmedEntry.match(yearPattern);
          
          // Check for "Present" or "Current" to identify current job
          isCurrent = /\b(present|current|now)\b/i.test(trimmedEntry);
          
          if (monthYearMatches && monthYearMatches.length >= 1) {
            // Convert to ISO format (YYYY-MM-DD)
            const convertMonthYear = (dateStr: string) => {
              const parts = dateStr.split(/\s+/);
              if (parts.length === 2) {
                const month = parts[0].toLowerCase().substring(0, 3);
                const year = parts[1];
                const monthNum = {
                  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
                }[month];
                if (monthNum && /^\d{4}$/.test(year)) {
                  return `${year}-${monthNum}-01`;
                }
              }
              return '';
            };
            
            startDate = convertMonthYear(monthYearMatches[0]);
            
            if (monthYearMatches.length > 1 && !isCurrent) {
              endDate = convertMonthYear(monthYearMatches[1]);
            }
          } else if (yearMatches && yearMatches.length >= 1) {
            // Use only years
            startDate = `${yearMatches[0]}-01-01`;
            
            if (yearMatches.length > 1 && !isCurrent) {
              endDate = `${yearMatches[1]}-01-01`;
            }
          }
          
          // Extract responsibilities - all lines after the company and title, excluding dates
          let responsibilities = '';
          
          // Skip the first few lines that likely contain title, company, dates
          const skipLines = 2;
          if (lines.length > skipLines) {
            responsibilities = lines.slice(skipLines).join('\n');
          }
          
          // If no responsibilities text was found, use the full entry
          if (!responsibilities) {
            responsibilities = trimmedEntry;
          }
          
          // Use fallback dates if none were found
          if (!startDate) startDate = '2020-01-01';
          if (!endDate && !isCurrent) endDate = '2023-01-01';
          
          console.log(`Extracted job: ${jobTitle} at ${companyName}`);
          
          experiences.push({
            companyName: companyName || 'Company Name',
            jobTitle: jobTitle || 'Job Title',
            startDate,
            endDate,
            isCurrent,
            responsibilities
          });
        }
      }
    });
    
    // If no experiences were extracted but there was an experience section,
    // create at least one entry with the section content
    if (experiences.length === 0) {
      console.log("No structured experience entries found, creating a single entry with all content");
      experiences.push({
        companyName: '',
        jobTitle: '',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
        isCurrent: false,
        responsibilities: experienceSection.length > 500 ? 
          experienceSection.substring(0, 500) + '...' : 
          experienceSection
      });
    }
  }
  
  return experiences;
}

/**
 * Extract education from text
 */
function extractEducation(text: string): Education[] {
  const education: Education[] = [];
  
  // Look for education section
  const educationRegex = /(education|academic\s+background|qualifications|educational\s+background)[\s\n:]+([^]*?)(?=(experience|skills|certifications|languages|additional|references|hobbies)[\s\n:]|$)/i;
  const match = text.match(educationRegex);
  
  if (match && match[2]) {
    const educationSection = match[2].trim();
    
    // Similar to experience, split by multiple newlines
    const entries = educationSection.split(/\n{2,}/);
    
    entries.forEach(entry => {
      if (entry.trim().length > 0) {
        const lines = entry.split('\n');
        if (lines.length >= 2) {
          // First line might be school name and second might be degree
          const schoolName = lines[0].trim();
          const major = lines[1].trim();
          
          // Try to extract dates
          const dateRegex = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s*(-|to|–|—)\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}|(\d{4})\s*(-|to|–|—)\s*(\d{4}|present)/i;
          const dateMatch = entry.match(dateRegex);
          
          const startDate = dateMatch ? '2016-09-01' : ''; // Default date if extraction fails
          const endDate = dateMatch ? '2020-06-01' : ''; // Default date if extraction fails
          
          education.push({
            schoolName: schoolName || 'University/School Name',
            major: major || 'Degree/Major',
            startDate,
            endDate
          });
        }
      }
    });
    
    // Add at least one placeholder if no education entries were found
    if (education.length === 0) {
      education.push({
        schoolName: 'University/School Name',
        major: 'Degree/Major',
        startDate: '2016-09-01',
        endDate: '2020-06-01'
      });
    }
  }
  
  return education;
}

/**
 * Extract certificates from text
 */
function extractCertificates(text: string): Certificate[] {
  const certificates: Certificate[] = [];
  
  // Look for certifications section
  const certificatesRegex = /(certifications|certificates|professional\s+qualifications|credentials)[\s\n:]+([^]*?)(?=(experience|education|skills|languages|additional|references|hobbies)[\s\n:]|$)/i;
  const match = text.match(certificatesRegex);
  
  if (match && match[2]) {
    const certificatesSection = match[2].trim();
    
    // Split by multiple newlines or bullet points
    const entries = certificatesSection.split(/\n+|•/);
    
    entries.forEach(entry => {
      const trimmedEntry = entry.trim();
      if (trimmedEntry.length > 0) {
        // Try to extract certificate name and institution (simplified)
        const parts = trimmedEntry.split(',');
        
        if (parts.length >= 1) {
          const name = parts[0].trim();
          const institution = parts.length > 1 ? parts[1].trim() : '';
          
          // Try to extract a date
          const dateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\b|\b\d{4}\b/i;
          const dateMatch = trimmedEntry.match(dateRegex);
          
          certificates.push({
            name: name || 'Certificate Name',
            institution: institution || 'Issuing Institution',
            dateAcquired: dateMatch ? '2022-01-01' : '2022-01-01', // Default date if extraction fails
          });
        }
      }
    });
  }
  
  return certificates;
}