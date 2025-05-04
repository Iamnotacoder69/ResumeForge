import { jsPDF } from "jspdf";
import { CompleteCV, SectionOrder } from "@shared/types";

// Spacing constants (in mm) - FIXED VALUES FOR CONSISTENCY
const SECTION_SPACING = 7;        // Space between major sections
const ENTRY_SPACING = 5;          // Space between entries within a section
const SECTION_TITLE_SPACING = 2;  // Extra space after section titles
const LINE_HEIGHT = 4;            // Standard line height

// Debug mode for development use only (disabled in production)
const DEBUG_MODE = false;

// Helper function to log spacing information during development
function logSpacing(section: string, position: string, y: number) {
  if (!DEBUG_MODE) return;
  console.log(`[SPACING] ${section} - ${position} at y=${y.toFixed(1)}`);
}

// Helper function to visualize spacing issues with colored lines (for debugging only)
function debugSpacing(doc: jsPDF, y: number, color: [number, number, number], label: string, margin: number, pageWidth: number) {
  if (!DEBUG_MODE) return;
  
  const originalDrawColor = doc.getDrawColor();
  const originalTextColor = doc.getTextColor();
  const originalFontSize = doc.getFontSize();
  
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.line(margin, y, pageWidth - margin, y);
  
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFontSize(8);
  doc.text(`${label}: ${y.toFixed(1)}`, margin + 2, y - 1);
  
  doc.setDrawColor(originalDrawColor);
  doc.setTextColor(originalTextColor);
  doc.setFontSize(originalFontSize);
}

// Helper function to handle photo URLs, converting base64 data URLs if needed
function prepareImageForPDF(photoUrl: string): { imageData: string, format: string } {
  let format = 'JPEG';
  let imageData = photoUrl;
  
  // Handle data URLs
  if (photoUrl.startsWith('data:image/png;base64,')) {
    format = 'PNG';
    imageData = photoUrl.substring('data:image/png;base64,'.length);
  } else if (photoUrl.startsWith('data:image/jpeg;base64,')) {
    format = 'JPEG';
    imageData = photoUrl.substring('data:image/jpeg;base64,'.length);
  } else if (photoUrl.startsWith('data:image/')) {
    const formatMatch = photoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    if (formatMatch && formatMatch[1]) {
      format = formatMatch[1].toUpperCase();
      const prefix = `data:image/${formatMatch[1]};base64,`;
      imageData = photoUrl.substring(prefix.length);
    }
  }
  
  return { imageData, format };
}

// Helper for safe date formatting
function formatDate(dateStr: string | undefined, isCurrent: boolean = false): string {
  if (isCurrent) return 'Present';
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateStr; // Return original string if formatting fails
  }
}

// Single template style for consistent formatting
const templateStyle = {
  titleFont: "helvetica",
  bodyFont: "helvetica",
  titleFontSize: 14,              // Name size only
  subtitleFontSize: 11,           // Section titles
  sectionTitleFontSize: 11,       // Subsection titles
  bodyFontSize: 11,               // Body text
  lineHeight: LINE_HEIGHT,
  primaryColor: [0, 62, 116],     // Blue
  secondaryColor: [70, 70, 70],   // Dark gray
  accentColor: [0, 103, 164],     // Light blue
  margin: 15
};

/**
 * Generates a PDF document from CV data
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
  console.log("PDF Generation - Started with standard template");
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  // Check if photo should be included
  const includePhoto = data.templateSettings?.includePhoto || false;
  
  // Get style properties
  const {
    titleFont, bodyFont, titleFontSize, subtitleFontSize, 
    sectionTitleFontSize, bodyFontSize, lineHeight,
    primaryColor, secondaryColor, accentColor, margin
  } = templateStyle;
  
  // Calculate page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (margin * 2);
  
  // Start position
  let yPos = margin;
  
  // ----- HEADER SECTION -----
  // Name at top left
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(titleFont, "bold");
  doc.setFontSize(titleFontSize);
  const fullName = `${data.personal.firstName} ${data.personal.lastName}`;
  doc.text(fullName, margin, yPos);
  
  // Contact info at top right
  doc.setFont(bodyFont, "normal");
  doc.setFontSize(bodyFontSize);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const emailText = data.personal.email || '';
  const phoneText = data.personal.phone || '';
  const linkedinText = data.personal.linkedin ? `linkedin.com/in/${data.personal.linkedin}` : '';
  
  // Right-align contact information
  const emailWidth = doc.getTextWidth(emailText);
  const phoneWidth = doc.getTextWidth(phoneText);
  const linkedinWidth = doc.getTextWidth(linkedinText);
  
  doc.text(emailText, pageWidth - margin - emailWidth, margin);
  doc.text(phoneText, pageWidth - margin - phoneWidth, margin + lineHeight);
  if (linkedinText) {
    doc.text(linkedinText, pageWidth - margin - linkedinWidth, margin + (lineHeight * 2));
  }
  
  // Add photo if included
  if (includePhoto && data.personal.photoUrl) {
    try {
      const photoSize = 25;
      const photoX = (pageWidth / 2) - (photoSize / 2);
      const photoY = margin;
      
      const { imageData, format } = prepareImageForPDF(data.personal.photoUrl);
      
      try {
        doc.addImage(data.personal.photoUrl, format, photoX, photoY, photoSize, photoSize);
      } catch (e) {
        doc.addImage(imageData, format, photoX, photoY, photoSize, photoSize);
      }
      
      // Adjust Y position after photo (if photo is taller than contact info)
      const photoBottom = photoY + photoSize + 5;
      const contactInfoBottom = margin + (linkedinText ? lineHeight * 3 : lineHeight * 2) + 2;
      yPos = Math.max(photoBottom, contactInfoBottom);
    } catch (error) {
      console.error("Error adding photo:", error);
      // If photo fails, just advance position after contact info
      yPos += (linkedinText ? lineHeight * 3 : lineHeight * 2) + 5;
    }
  } else {
    // No photo, just advance position after contact info or name
    yPos += Math.max(lineHeight * 2, (linkedinText ? lineHeight * 3 : lineHeight * 2)) + 2;
  }
  
  // Add divider line
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;
  
  // Set up default sections order
  const sectionOrder: SectionOrder[] = data.templateSettings?.sectionOrder?.filter(section => section.visible) || [
    { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
    { id: 'experience', name: 'Work Experience', visible: true, order: 1 },
    { id: 'education', name: 'Education', visible: true, order: 2 },
    { id: 'certificates', name: 'Certificates', visible: true, order: 3 },
    { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 4 },
    { id: 'additional', name: 'Additional Information', visible: true, order: 5 },
  ];
  
  // ----- CONTENT SECTIONS -----
  // Process each section based on order
  for (const section of sectionOrder) {
    if (!section.visible) continue;
    
    // Check if we need a page break
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    // Add section based on type
    switch (section.id) {
      case 'summary':
        // Professional Summary section
        if (data.professional?.summary) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("PROFESSIONAL SUMMARY", margin, yPos);
          yPos += lineHeight + SECTION_TITLE_SPACING;
          
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);
          
          const summary = data.professional.summary;
          if (summary && typeof summary === 'string') {
            const summaryLines = doc.splitTextToSize(summary, contentWidth);
            doc.text(summaryLines, margin, yPos);
            yPos += (summaryLines.length * lineHeight);
          }
          
          yPos += SECTION_SPACING;
        }
        break;
        
      case 'experience':
        // Work Experience section
        if (data.experience && data.experience.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("WORK EXPERIENCE", margin, yPos);
          yPos += lineHeight + SECTION_TITLE_SPACING;
          
          for (let i = 0; i < data.experience.length; i++) {
            const exp = data.experience[i];
            
            // Add page break if needed
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }
            
            // Job title
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(exp.jobTitle || '', margin, yPos);
            yPos += lineHeight;
            
            // Company and dates
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);
            
            const startDateStr = formatDate(exp.startDate);
            const endDateStr = exp.isCurrent ? 'Present' : formatDate(exp.endDate);
            const dateRange = `${startDateStr} - ${endDateStr}`;
            
            doc.text(`${exp.companyName || ''} | ${dateRange}`, margin, yPos);
            yPos += lineHeight;
            
            // Responsibilities
            if (exp.responsibilities && typeof exp.responsibilities === 'string') {
              doc.setFont(bodyFont, "normal");
              const respLines = doc.splitTextToSize(exp.responsibilities, contentWidth);
              doc.text(respLines, margin, yPos);
              yPos += (respLines.length * lineHeight);
            }
            
            // Only add spacing between entries, not after the last one
            if (i < data.experience.length - 1) {
              yPos += ENTRY_SPACING;
            }
          }
          
          yPos += SECTION_SPACING;
        }
        break;
        
      case 'education':
        // Education section
        if (data.education && data.education.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("EDUCATION", margin, yPos);
          yPos += lineHeight + SECTION_TITLE_SPACING;
          
          for (let i = 0; i < data.education.length; i++) {
            const edu = data.education[i];
            
            // Add page break if needed
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }
            
            // Degree/Major
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(edu.major || '', margin, yPos);
            yPos += lineHeight;
            
            // School and dates
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);
            
            const startDateStr = formatDate(edu.startDate);
            const endDateStr = formatDate(edu.endDate);
            const dateRange = `${startDateStr} - ${endDateStr}`;
            
            doc.text(`${edu.schoolName || ''} | ${dateRange}`, margin, yPos);
            yPos += lineHeight;
            
            // Achievements
            if (edu.achievements && typeof edu.achievements === 'string') {
              doc.setFont(bodyFont, "normal");
              const achLines = doc.splitTextToSize(edu.achievements, contentWidth);
              doc.text(achLines, margin, yPos);
              yPos += (achLines.length * lineHeight);
            }
            
            // Only add spacing between entries, not after the last one
            if (i < data.education.length - 1) {
              yPos += ENTRY_SPACING;
            }
          }
          
          yPos += SECTION_SPACING;
        }
        break;
        
      case 'certificates':
        // Certificates section
        if (data.certificates && data.certificates.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("CERTIFICATIONS", margin, yPos);
          yPos += lineHeight + SECTION_TITLE_SPACING;
          
          for (let i = 0; i < data.certificates.length; i++) {
            const cert = data.certificates[i];
            
            // Add page break if needed
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }
            
            // Certificate name
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(cert.name || '', margin, yPos);
            yPos += lineHeight;
            
            // Institution and date
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);
            
            const acquiredDate = formatDate(cert.dateAcquired);
            const expDate = cert.expirationDate ? ` (Expires: ${formatDate(cert.expirationDate)})` : '';
            
            doc.text(`${cert.institution || ''} | ${acquiredDate}${expDate}`, margin, yPos);
            yPos += lineHeight;
            
            // Achievements/Details
            if (cert.achievements && typeof cert.achievements === 'string') {
              doc.setFont(bodyFont, "normal");
              const achLines = doc.splitTextToSize(cert.achievements, contentWidth);
              doc.text(achLines, margin, yPos);
              yPos += (achLines.length * lineHeight);
            }
            
            // Only add spacing between entries, not after the last one
            if (i < data.certificates.length - 1) {
              yPos += ENTRY_SPACING;
            }
          }
          
          yPos += SECTION_SPACING;
        }
        break;
        
      case 'extracurricular':
        // Extracurricular Activities section
        if (data.extracurricular && data.extracurricular.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("EXTRACURRICULAR ACTIVITIES", margin, yPos);
          yPos += lineHeight + SECTION_TITLE_SPACING;
          
          for (let i = 0; i < data.extracurricular.length; i++) {
            const extra = data.extracurricular[i];
            
            // Add page break if needed
            if (yPos > pageHeight - 30) {
              doc.addPage();
              yPos = margin;
            }
            
            // Role
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(extra.role || '', margin, yPos);
            yPos += lineHeight;
            
            // Organization and dates
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);
            
            const startDateStr = formatDate(extra.startDate);
            const endDateStr = extra.isCurrent ? 'Present' : formatDate(extra.endDate);
            const dateRange = `${startDateStr} - ${endDateStr}`;
            
            doc.text(`${extra.organization || ''} | ${dateRange}`, margin, yPos);
            yPos += lineHeight;
            
            // Description
            if (extra.description && typeof extra.description === 'string') {
              doc.setFont(bodyFont, "normal");
              const descLines = doc.splitTextToSize(extra.description, contentWidth);
              doc.text(descLines, margin, yPos);
              yPos += (descLines.length * lineHeight);
            }
            
            // Only add spacing between entries, not after the last one
            if (i < data.extracurricular.length - 1) {
              yPos += ENTRY_SPACING;
            }
          }
          
          yPos += SECTION_SPACING;
        }
        break;
        
      case 'additional':
        // Additional Information section
        if ((data.additionalInfo?.skills && data.additionalInfo.skills.length > 0) || 
            (data.keyCompetencies?.technicalSkills && data.keyCompetencies.technicalSkills.length > 0) ||
            (data.keyCompetencies?.softSkills && data.keyCompetencies.softSkills.length > 0) ||
            (data.languages && data.languages.length > 0)) {
          
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("ADDITIONAL INFORMATION", margin, yPos);
          yPos += lineHeight + SECTION_TITLE_SPACING;
          
          // Languages subsection
          if (data.languages && data.languages.length > 0) {
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text("Languages", margin, yPos);
            yPos += lineHeight;
            
            doc.setFont(bodyFont, "normal");
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            
            const langTexts = data.languages.map(lang => 
              `${lang.name}: ${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)}`
            );
            
            const langText = langTexts.join(', ');
            const langLines = doc.splitTextToSize(langText, contentWidth);
            doc.text(langLines, margin, yPos);
            yPos += (langLines.length * lineHeight) + ENTRY_SPACING;
          }
          
          // Technical Skills subsection
          if (data.keyCompetencies?.technicalSkills && data.keyCompetencies.technicalSkills.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text("Technical Skills", margin, yPos);
            yPos += lineHeight;
            
            doc.setFont(bodyFont, "normal");
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            
            const techText = data.keyCompetencies.technicalSkills.join(', ');
            const techLines = doc.splitTextToSize(techText, contentWidth);
            doc.text(techLines, margin, yPos);
            yPos += (techLines.length * lineHeight) + ENTRY_SPACING;
          }
          
          // Soft Skills subsection
          if (data.keyCompetencies?.softSkills && data.keyCompetencies.softSkills.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text("Soft Skills", margin, yPos);
            yPos += lineHeight;
            
            doc.setFont(bodyFont, "normal");
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            
            const softText = data.keyCompetencies.softSkills.join(', ');
            const softLines = doc.splitTextToSize(softText, contentWidth);
            doc.text(softLines, margin, yPos);
            yPos += (softLines.length * lineHeight) + ENTRY_SPACING;
          }
          
          // Other skills subsection
          if (data.additionalInfo?.skills && data.additionalInfo.skills.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text("Other Skills", margin, yPos);
            yPos += lineHeight;
            
            doc.setFont(bodyFont, "normal");
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            
            const otherText = data.additionalInfo.skills.join(', ');
            const otherLines = doc.splitTextToSize(otherText, contentWidth);
            doc.text(otherLines, margin, yPos);
            yPos += (otherLines.length * lineHeight);
          }
          
          yPos += SECTION_SPACING;
        }
        break;
    }
  }
  
  return doc.output('arraybuffer');
}