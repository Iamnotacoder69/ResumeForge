import { jsPDF } from "jspdf";
import { CompleteCV, SectionOrder, TemplateType } from "@shared/types";

/**
 * COMPACT CV TEMPLATE
 * Based on the example provided - clean, professional with slim margins and tight spacing
 */

// These values are carefully calibrated to match the example CV
const LAYOUT = {
  // Margins are minimal to maximize content space (values in mm)
  MARGIN: {
    TOP: 10,
    BOTTOM: 10,
    LEFT: 15,
    RIGHT: 15
  },
  // Spacing is tight and consistent
  SPACING: {
    AFTER_NAME: 3,        // Space after name at top
    AFTER_CONTACT: 3,      // Space after contact info
    AFTER_SECTION_TITLE: 2, // Space after each section title
    BETWEEN_ENTRIES: 5,    // Space between entries within a section
    BETWEEN_SECTIONS: 8,   // Space between major sections
    ENTRY_LINE_GAP: 0.5     // Minimal spacing between lines in an entry
  },
  // Separator line style
  SEPARATOR: {
    WIDTH: 1,               // Thickness of separator lines
    COLOR: [40, 40, 40]     // Dark gray for lines
  }
};

// Typography settings to match compact example
const TYPOGRAPHY = {
  NAME: {
    FONT: "helvetica",
    STYLE: "bold",
    SIZE: 18,
    COLOR: [60, 60, 60] // Dark gray
  },
  CONTACT: {
    FONT: "helvetica",
    STYLE: "normal",
    SIZE: 10,
    COLOR: [60, 60, 60]
  },
  SECTION_TITLE: {
    FONT: "helvetica",
    STYLE: "bold",
    SIZE: 12,
    COLOR: [60, 60, 60]
  },
  JOB_TITLE: {
    FONT: "helvetica",
    STYLE: "bold",
    SIZE: 10,
    COLOR: [60, 60, 60]
  },
  COMPANY: {
    FONT: "helvetica",
    STYLE: "normal",
    SIZE: 10,
    COLOR: [60, 60, 60]
  },
  DATE: {
    FONT: "helvetica",
    STYLE: "normal",
    SIZE: 10,
    COLOR: [60, 60, 60]
  },
  BODY_TEXT: {
    FONT: "helvetica",
    STYLE: "normal",
    SIZE: 10,
    COLOR: [60, 60, 60]
  }
};

/**
 * Helper function to apply text style
 */
function applyTextStyle(doc: jsPDF, style: keyof typeof TYPOGRAPHY): void {
  const settings = TYPOGRAPHY[style];
  doc.setFont(settings.FONT, settings.STYLE);
  doc.setFontSize(settings.SIZE);
  doc.setTextColor(settings.COLOR[0], settings.COLOR[1], settings.COLOR[2]);
}

/**
 * Helper function to add a separator line
 */
function addSeparator(doc: jsPDF, y: number): number {
  const pageWidth = doc.internal.pageSize.width;
  doc.setDrawColor(LAYOUT.SEPARATOR.COLOR[0], LAYOUT.SEPARATOR.COLOR[1], LAYOUT.SEPARATOR.COLOR[2]);
  doc.setLineWidth(LAYOUT.SEPARATOR.WIDTH);
  doc.line(LAYOUT.MARGIN.LEFT, y, pageWidth - LAYOUT.MARGIN.RIGHT, y);
  doc.setLineWidth(0.1); // Reset to default
  return y + LAYOUT.SPACING.AFTER_SECTION_TITLE;
}

/**
 * Helper function to add wrapped text with bullet points
 */
function addText(doc: jsPDF, text: string | undefined, x: number, y: number, maxWidth: number): number {
  if (!text || typeof text !== 'string' || text.trim() === '') return y;
  
  // Split by new lines first
  const paragraphs = text.split('\n');
  let currentY = y;
  
  paragraphs.forEach((paragraph) => {
    if (paragraph.trim() === '') return; // Skip empty paragraphs
    
    // Format bullet points if line starts with - or •
    const hasBullet = paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•');
    let processedText = paragraph;
    
    if (hasBullet) {
      // Create proper bullet point formatting
      processedText = paragraph.trim().substring(1).trim();
      const bulletX = x;
      const textX = x + 4; // Indent text after bullet
      
      // Add bullet point
      doc.text('•', bulletX, currentY);
      
      // Process remaining text with indentation
      const bulletLines = doc.splitTextToSize(processedText, maxWidth - 4);
      doc.text(bulletLines, textX, currentY);
      currentY += (bulletLines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778)) + LAYOUT.SPACING.ENTRY_LINE_GAP;
    } else {
      // Regular paragraph
      const lines = doc.splitTextToSize(paragraph, maxWidth);
      doc.text(lines, x, currentY);
      currentY += (lines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778)) + LAYOUT.SPACING.ENTRY_LINE_GAP;
    }
  });
  
  return currentY;
}

/**
 * Format a date string consistently
 */
function formatDate(dateStr: string | undefined, isCurrent: boolean = false): string {
  if (isCurrent) return "Present";
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') return '';
  
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (error) {
    console.error("Error formatting date:", error, "Date string:", dateStr);
    return dateStr; // Return original string if parsing fails
  }
}

/**
 * Generate a compact PDF CV
 */
export async function generateCompactCV(data: CompleteCV): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - LAYOUT.MARGIN.LEFT - LAYOUT.MARGIN.RIGHT;
  let y = LAYOUT.MARGIN.TOP;
  
  // Set up default section order if not provided
  const defaultSectionOrder: SectionOrder[] = [
    { id: 'summary', name: 'Profile', visible: true, order: 0 },
    { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
    { id: 'experience', name: 'Experience', visible: true, order: 2 },
    { id: 'education', name: 'Education', visible: true, order: 3 },
    { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
    { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
    { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
  ];
  
  // Use user-defined section order or fall back to default
  const sectionOrder = data.templateSettings?.sectionOrder?.filter(section => section.visible) || defaultSectionOrder;

  // ==========================================
  // HEADER - Name and Contact Information
  // ==========================================
  applyTextStyle(doc, 'NAME');
  doc.text(`${data.personal.firstName} ${data.personal.lastName}`, LAYOUT.MARGIN.LEFT, y);
  y += LAYOUT.SPACING.AFTER_NAME;
  
  // Add separator line
  y = addSeparator(doc, y);
  y += 1; // Small extra space
  
  // Contact information on one line
  applyTextStyle(doc, 'CONTACT');
  let contactText = '';
  
  if (data.personal.email) {
    contactText += `${data.personal.email}`;
  }
  
  if (data.personal.phone) {
    if (contactText) contactText += ' | ';
    contactText += `${data.personal.phone}`;
  }
  
  if (data.personal.linkedin) {
    if (contactText) contactText += ' | ';
    contactText += `${data.personal.linkedin}`;
  }
  
  doc.text(contactText, LAYOUT.MARGIN.LEFT, y);
  y += LAYOUT.SPACING.AFTER_CONTACT + 3; // Add a bit more space after contact info
  
  // ==========================================
  // SECTIONS - Process each section
  // ==========================================
  for (const section of sectionOrder) {
    // Skip hidden sections
    if (!section.visible) continue;
    
    // Check if we need a new page
    if (y > doc.internal.pageSize.height - LAYOUT.MARGIN.BOTTOM - 20) {
      doc.addPage();
      y = LAYOUT.MARGIN.TOP;
    }
    
    // Process each section type
    switch (section.id) {
      // ==========================================
      // PROFILE/SUMMARY
      // ==========================================
      case 'summary':
        if (data.professional?.summary) {
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Profile', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          applyTextStyle(doc, 'BODY_TEXT');
          const summaryLines = doc.splitTextToSize(data.professional.summary, contentWidth);
          doc.text(summaryLines, LAYOUT.MARGIN.LEFT, y);
          y += summaryLines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778);
          
          // Add space after section
          y += LAYOUT.SPACING.BETWEEN_SECTIONS;
        }
        break;
      
      // ==========================================
      // KEY COMPETENCIES
      // ==========================================
      case 'keyCompetencies':
        if (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) {
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Key Competencies', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          applyTextStyle(doc, 'BODY_TEXT');
          
          // Technical Skills
          if (data.keyCompetencies?.technicalSkills?.length) {
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text('Technical Skills', LAYOUT.MARGIN.LEFT, y);
            y += TYPOGRAPHY.JOB_TITLE.SIZE * 0.352777778 + 1;
            
            applyTextStyle(doc, 'BODY_TEXT');
            const techSkills = data.keyCompetencies.technicalSkills.join(', ');
            const techLines = doc.splitTextToSize(techSkills, contentWidth);
            doc.text(techLines, LAYOUT.MARGIN.LEFT, y);
            y += techLines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778) + 2;
          }
          
          // Soft Skills
          if (data.keyCompetencies?.softSkills?.length) {
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text('Soft Skills', LAYOUT.MARGIN.LEFT, y);
            y += TYPOGRAPHY.JOB_TITLE.SIZE * 0.352777778 + 1;
            
            applyTextStyle(doc, 'BODY_TEXT');
            const softSkills = data.keyCompetencies.softSkills.join(', ');
            const softLines = doc.splitTextToSize(softSkills, contentWidth);
            doc.text(softLines, LAYOUT.MARGIN.LEFT, y);
            y += softLines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778);
          }
          
          // Add space after section
          y += LAYOUT.SPACING.BETWEEN_SECTIONS;
        }
        break;
      
      // ==========================================
      // EXPERIENCE
      // ==========================================
      case 'experience':
        if (data.experience?.length) {
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Experience', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          // Add separator line
          y = addSeparator(doc, y);
          y += 2; // Small extra space
          
          // Process each experience entry
          data.experience.forEach((exp, index) => {
            // Check if need to add page break
            if (y > doc.internal.pageSize.height - LAYOUT.MARGIN.BOTTOM - 20) {
              doc.addPage();
              y = LAYOUT.MARGIN.TOP;
            }
            
            // Two-column layout with job title on left, dates on right
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text(exp.jobTitle, LAYOUT.MARGIN.LEFT, y);
            
            // Date on the right
            const startDate = formatDate(exp.startDate);
            const endDate = exp.isCurrent ? 'Present' : formatDate(exp.endDate);
            const dateText = `${startDate} – ${endDate}`;
            
            applyTextStyle(doc, 'DATE');
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - LAYOUT.MARGIN.RIGHT - dateWidth, y);
            
            y += TYPOGRAPHY.JOB_TITLE.SIZE * 0.352777778 + 1;
            
            // Company name
            applyTextStyle(doc, 'COMPANY');
            doc.text(exp.companyName, LAYOUT.MARGIN.LEFT, y);
            y += TYPOGRAPHY.COMPANY.SIZE * 0.352777778 + 1;
            
            // Responsibilities with bullet points
            if (exp.responsibilities) {
              applyTextStyle(doc, 'BODY_TEXT');
              y = addText(doc, exp.responsibilities, LAYOUT.MARGIN.LEFT, y, contentWidth);
            }
            
            // Add space between entries
            if (index < data.experience.length - 1) {
              y += LAYOUT.SPACING.BETWEEN_ENTRIES;
            }
          });
          
          // Space after section
          y += LAYOUT.SPACING.BETWEEN_SECTIONS;
        }
        break;
      
      // ==========================================
      // EDUCATION
      // ==========================================
      case 'education':
        if (data.education?.length) {
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Education', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          // Add separator line
          y = addSeparator(doc, y);
          y += 2; // Small extra space
          
          // Process each education entry
          data.education.forEach((edu, index) => {
            // Check if need to add page break
            if (y > doc.internal.pageSize.height - LAYOUT.MARGIN.BOTTOM - 20) {
              doc.addPage();
              y = LAYOUT.MARGIN.TOP;
            }
            
            // Two column layout - degree left, dates right
            applyTextStyle(doc, 'JOB_TITLE');
            
            // Create two-column layout with dates on right
            const startDate = formatDate(edu.startDate);
            const endDate = formatDate(edu.endDate);
            const dateText = endDate; // Usually just show end date
            
            // Calculate positions for right alignment
            const dateWidth = doc.getTextWidth(dateText);
            
            // Major/Degree title
            doc.text(edu.major, LAYOUT.MARGIN.LEFT, y);
            
            // Date on the right
            applyTextStyle(doc, 'DATE');
            doc.text(dateText, pageWidth - LAYOUT.MARGIN.RIGHT - dateWidth, y);
            
            y += TYPOGRAPHY.JOB_TITLE.SIZE * 0.352777778 + 1;
            
            // School name
            applyTextStyle(doc, 'COMPANY');
            doc.text(edu.schoolName, LAYOUT.MARGIN.LEFT, y);
            y += TYPOGRAPHY.COMPANY.SIZE * 0.352777778 + 1;
            
            // Achievements if any
            if (edu.achievements) {
              applyTextStyle(doc, 'BODY_TEXT');
              y = addText(doc, edu.achievements, LAYOUT.MARGIN.LEFT, y, contentWidth);
            }
            
            // Add space between entries
            if (index < data.education.length - 1) {
              y += LAYOUT.SPACING.BETWEEN_ENTRIES;
            }
          });
          
          // Space after section
          y += LAYOUT.SPACING.BETWEEN_SECTIONS;
        }
        break;
      
      // ==========================================
      // CERTIFICATES
      // ==========================================
      case 'certificates':
        if (data.certificates?.length) {
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Certificates', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          // Add separator line
          y = addSeparator(doc, y);
          y += 2; // Small extra space
          
          // Process each certificate entry
          data.certificates.forEach((cert, index) => {
            // Check if need to add page break
            if (y > doc.internal.pageSize.height - LAYOUT.MARGIN.BOTTOM - 20) {
              doc.addPage();
              y = LAYOUT.MARGIN.TOP;
            }
            
            // Certificate name
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text(cert.name, LAYOUT.MARGIN.LEFT, y);
            
            // Date on the right
            const dateText = formatDate(cert.dateAcquired);
            applyTextStyle(doc, 'DATE');
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - LAYOUT.MARGIN.RIGHT - dateWidth, y);
            
            y += TYPOGRAPHY.JOB_TITLE.SIZE * 0.352777778 + 1;
            
            // Institution
            applyTextStyle(doc, 'COMPANY');
            doc.text(cert.institution, LAYOUT.MARGIN.LEFT, y);
            y += TYPOGRAPHY.COMPANY.SIZE * 0.352777778 + 1;
            
            // Description if any
            if (cert.achievements) {
              applyTextStyle(doc, 'BODY_TEXT');
              y = addText(doc, cert.achievements, LAYOUT.MARGIN.LEFT, y, contentWidth);
            }
            
            // Add space between entries
            if (index < data.certificates.length - 1) {
              y += LAYOUT.SPACING.BETWEEN_ENTRIES;
            }
          });
          
          // Space after section
          y += LAYOUT.SPACING.BETWEEN_SECTIONS;
        }
        break;
      
      // ==========================================
      // EXTRACURRICULAR
      // ==========================================
      case 'extracurricular':
        if (data.extracurricular?.length) {
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Extracurricular Activities', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          // Add separator line
          y = addSeparator(doc, y);
          y += 2; // Small extra space
          
          // Process each extracurricular entry
          data.extracurricular.forEach((activity, index) => {
            // Check if need to add page break
            if (y > doc.internal.pageSize.height - LAYOUT.MARGIN.BOTTOM - 20) {
              doc.addPage();
              y = LAYOUT.MARGIN.TOP;
            }
            
            // Role
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text(activity.role, LAYOUT.MARGIN.LEFT, y);
            
            // Date on the right
            const startDate = formatDate(activity.startDate);
            const endDate = activity.isCurrent ? 'Present' : formatDate(activity.endDate);
            const dateText = `${startDate} – ${endDate}`;
            applyTextStyle(doc, 'DATE');
            const dateWidth = doc.getTextWidth(dateText);
            doc.text(dateText, pageWidth - LAYOUT.MARGIN.RIGHT - dateWidth, y);
            
            y += TYPOGRAPHY.JOB_TITLE.SIZE * 0.352777778 + 1;
            
            // Organization
            applyTextStyle(doc, 'COMPANY');
            doc.text(activity.organization, LAYOUT.MARGIN.LEFT, y);
            y += TYPOGRAPHY.COMPANY.SIZE * 0.352777778 + 1;
            
            // Description with bullet points
            if (activity.description) {
              applyTextStyle(doc, 'BODY_TEXT');
              y = addText(doc, activity.description, LAYOUT.MARGIN.LEFT, y, contentWidth);
            }
            
            // Add space between entries
            if (index < data.extracurricular.length - 1) {
              y += LAYOUT.SPACING.BETWEEN_ENTRIES;
            }
          });
          
          // Space after section
          y += LAYOUT.SPACING.BETWEEN_SECTIONS;
        }
        break;
      
      // ==========================================
      // ADDITIONAL INFORMATION
      // ==========================================
      case 'additional':
        let hasAdditionalInfo = false;
        
        // Check if we have anything to display
        if (
          (data.additional?.skills && data.additional.skills.length > 0) ||
          (data.languages && data.languages.length > 0)
        ) {
          hasAdditionalInfo = true;
          
          applyTextStyle(doc, 'SECTION_TITLE');
          doc.text('Further Details', LAYOUT.MARGIN.LEFT, y);
          y += LAYOUT.SPACING.AFTER_SECTION_TITLE;
          
          // Add separator line
          y = addSeparator(doc, y);
          y += 2; // Small extra space
          
          // Computer skills
          if (data.additional?.skills && data.additional.skills.length > 0) {
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text('IT skills:', LAYOUT.MARGIN.LEFT, y);
            
            // Position skills text after the label
            applyTextStyle(doc, 'BODY_TEXT');
            const skillsText = data.additional.skills.join(', ');
            const labelWidth = doc.getTextWidth('IT skills:') + 5; // Add some spacing
            
            const skillsLines = doc.splitTextToSize(skillsText, contentWidth - labelWidth);
            doc.text(skillsLines, LAYOUT.MARGIN.LEFT + labelWidth, y);
            y += skillsLines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778) + 2;
          }
          
          // Languages
          if (data.languages && data.languages.length > 0) {
            applyTextStyle(doc, 'JOB_TITLE');
            doc.text('Languages:', LAYOUT.MARGIN.LEFT, y);
            
            // Position languages text after the label
            applyTextStyle(doc, 'BODY_TEXT');
            const languagesText = data.languages.map(lang => 
              `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
            ).join(', ');
            
            const labelWidth = doc.getTextWidth('Languages:') + 5; // Add some spacing
            const languagesLines = doc.splitTextToSize(languagesText, contentWidth - labelWidth);
            doc.text(languagesLines, LAYOUT.MARGIN.LEFT + labelWidth, y);
            y += languagesLines.length * (TYPOGRAPHY.BODY_TEXT.SIZE * 0.352777778);
          }
        }
        break;
      
      default:
        break;
    }
  }
  
  // Convert to buffer and return
  return Buffer.from(doc.output('arraybuffer'));
}