import { jsPDF } from "jspdf";
import { CompleteCV, SectionOrder, TemplateType } from "@shared/types";

/**
 * NEW PROFESSIONAL CV TEMPLATE GENERATOR
 * Features a grid-based layout with consistent spacing and typography
 */

// Define consistent layout constants for precise control
const GRID = {
  // Base grid unit (mm)
  UNIT: 4,
  // Spacing multipliers for consistent rhythm
  SPACING: {
    XS: 0.5,  // 2mm - Minimal spacing (e.g. between lines)
    S: 1,     // 4mm - Small spacing (e.g. after paragraphs)
    M: 2,     // 8mm - Medium spacing (between entries in a section)
    L: 3,     // 12mm - Large spacing (between sections)
    XL: 4     // 16mm - Extra large spacing (major divisions)
  },
  // Document margins
  MARGIN: 20
};

// Consistent typography settings
const TYPOGRAPHY = {
  TITLE: {
    FONT: "helvetica",
    STYLE: "bold",
    SIZE: 16,
    COLOR: [45, 62, 80] as [number, number, number] // Dark navy blue
  },
  SECTION_HEADING: {
    FONT: "helvetica",
    STYLE: "bold",
    SIZE: 12,
    COLOR: [45, 62, 80] as [number, number, number] // Dark navy blue
  },
  ENTRY_HEADING: {
    FONT: "helvetica",
    STYLE: "bold",
    SIZE: 10,
    COLOR: [70, 70, 70] as [number, number, number] // Dark gray
  },
  ENTRY_SUBHEADING: {
    FONT: "helvetica",
    STYLE: "italic",
    SIZE: 9,
    COLOR: [70, 70, 70] as [number, number, number] // Dark gray
  },
  BODY: {
    FONT: "helvetica",
    STYLE: "normal",
    SIZE: 9,
    COLOR: [50, 50, 50] as [number, number, number] // Nearly black
  },
  // Line height (multiplier of font size)
  LINE_HEIGHT: 1.2
};

// Separator line styles
const SEPARATOR = {
  THICKNESS: 0.5,
  COLOR: [180, 150, 90] as [number, number, number] // Gold accent
};

/**
 * Helper function to add a separator line
 */
function addSeparator(
  doc: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  color: [number, number, number] = SEPARATOR.COLOR,
  thickness: number = SEPARATOR.THICKNESS
): number {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(thickness);
  doc.line(x, y, x + width, y);
  return y + (GRID.UNIT * GRID.SPACING.XS);
}

/**
 * Helper function to safely format dates consistently
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
 * Helper function for adding wrapped text with bullet points
 */
function addText(
  doc: jsPDF,
  text: string | undefined,
  x: number,
  y: number,
  maxWidth: number
): number {
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
      currentY += (bulletLines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
    } else {
      // Regular paragraph
      const lines = doc.splitTextToSize(paragraph, maxWidth);
      doc.text(lines, x, currentY);
      currentY += (lines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
    }
  });
  
  return currentY;
}

/**
 * Set typography for a specific text style
 */
function setTextStyle(
  doc: jsPDF,
  style: 'TITLE' | 'SECTION_HEADING' | 'ENTRY_HEADING' | 'ENTRY_SUBHEADING' | 'BODY'
): void {
  const typography = TYPOGRAPHY[style];
  doc.setFont(typography.FONT, typography.STYLE);
  doc.setFontSize(typography.SIZE);
  doc.setTextColor(typography.COLOR[0], typography.COLOR[1], typography.COLOR[2]);
}

/**
 * Main function to generate a PDF document from CV data
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export function generatePDF(data: CompleteCV): Buffer {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = GRID.MARGIN;
  const contentWidth = pageWidth - (margin * 2);
  
  // Starting position for content
  let y = margin;
  const x = margin;
  
  // Set up default section order if not provided
  const defaultSectionOrder: SectionOrder[] = [
    { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
    { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
    { id: 'experience', name: 'Work Experience', visible: true, order: 2 },
    { id: 'education', name: 'Education', visible: true, order: 3 },
    { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
    { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
    { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
  ];
  
  // Use user-defined section order or fall back to default
  const sectionOrder = data.templateSettings?.sectionOrder?.filter(section => section.visible) || defaultSectionOrder;

  // -----------------------------------------------
  // HEADER SECTION - Name & Contact Information
  // -----------------------------------------------
  setTextStyle(doc, 'TITLE');
  doc.text(`${data.personal.firstName} ${data.personal.lastName}`, x, y);
  y += TYPOGRAPHY.TITLE.SIZE * TYPOGRAPHY.LINE_HEIGHT;
  
  // Contact information
  setTextStyle(doc, 'BODY');
  const contactInfo = `Email: ${data.personal.email} | Phone: ${data.personal.phone}`;
  doc.text(contactInfo, x, y);
  y += TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT;
  
  // Add LinkedIn if available
  if (data.personal.linkedin) {
    doc.text(`LinkedIn: linkedin.com/in/${data.personal.linkedin}`, x, y);
    y += TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT;
  }
  
  // Add header separator with precise spacing
  y += GRID.UNIT * GRID.SPACING.S;
  y = addSeparator(doc, x, y, contentWidth);
  y += GRID.UNIT * GRID.SPACING.M;
  
  // -----------------------------------------------
  // SECTIONS - Render each section in order
  // -----------------------------------------------
  for (const section of sectionOrder) {
    // Skip hidden sections
    if (!section.visible) continue;
    
    // Add page break if needed with exact threshold
    if (y > pageHeight - GRID.MARGIN - (TYPOGRAPHY.SECTION_HEADING.SIZE * 4)) {
      doc.addPage();
      y = margin;
    }
    
    // Render appropriate section
    switch (section.id) {
      // PROFESSIONAL SUMMARY
      // -----------------------------------------------
      case 'summary':
        if (data.professional?.summary) {
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Professional Summary", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Summary text
          setTextStyle(doc, 'BODY');
          const summaryLines = doc.splitTextToSize(data.professional.summary, contentWidth);
          doc.text(summaryLines, x, y);
          y += (summaryLines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
          
          // Add consistent spacing after section
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      // KEY COMPETENCIES
      // -----------------------------------------------
      case 'keyCompetencies':
        if (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) {
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Key Competencies", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Technical Skills
          if (data.keyCompetencies?.technicalSkills?.length) {
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text("Technical Skills", x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            setTextStyle(doc, 'BODY');
            const techSkillsText = data.keyCompetencies.technicalSkills.join(", ");
            const techLines = doc.splitTextToSize(techSkillsText, contentWidth);
            doc.text(techLines, x, y);
            y += (techLines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
            
            // Add spacing between skill sections
            y += GRID.UNIT * GRID.SPACING.S;
          }
          
          // Soft Skills
          if (data.keyCompetencies?.softSkills?.length) {
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text("Soft Skills", x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            setTextStyle(doc, 'BODY');
            const softSkillsText = data.keyCompetencies.softSkills.join(", ");
            const softLines = doc.splitTextToSize(softSkillsText, contentWidth);
            doc.text(softLines, x, y);
            y += (softLines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
          }
          
          // Add consistent spacing after section
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      // EXPERIENCE
      // -----------------------------------------------
      case 'experience':
        if (data.experience?.length) {
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Professional Experience", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Render each experience entry
          data.experience.forEach((exp, index) => {
            // Add page break if needed
            if (y > pageHeight - GRID.MARGIN - (TYPOGRAPHY.ENTRY_HEADING.SIZE * 6)) {
              doc.addPage();
              y = margin;
            }
            
            // Job title
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text(exp.jobTitle, x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Company and dates
            setTextStyle(doc, 'ENTRY_SUBHEADING');
            const startDate = formatDate(exp.startDate);
            const endDate = exp.isCurrent ? 'Present' : formatDate(exp.endDate);
            doc.text(`${exp.companyName} | ${startDate} - ${endDate}`, x, y);
            y += TYPOGRAPHY.ENTRY_SUBHEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Responsibilities
            if (exp.responsibilities) {
              setTextStyle(doc, 'BODY');
              y = addText(doc, exp.responsibilities, x, y, contentWidth);
            }
            
            // Add spacing between entries (except after the last one)
            if (index < data.experience.length - 1) {
              y += GRID.UNIT * GRID.SPACING.M;
            }
          });
          
          // Add consistent spacing after section
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      // EDUCATION
      // -----------------------------------------------
      case 'education':
        if (data.education?.length) {
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Education", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Render each education entry
          data.education.forEach((edu, index) => {
            // Add page break if needed
            if (y > pageHeight - GRID.MARGIN - (TYPOGRAPHY.ENTRY_HEADING.SIZE * 6)) {
              doc.addPage();
              y = margin;
            }
            
            // Degree/Major
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text(edu.major, x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // School and dates
            setTextStyle(doc, 'ENTRY_SUBHEADING');
            const startDate = formatDate(edu.startDate);
            const endDate = formatDate(edu.endDate);
            doc.text(`${edu.schoolName} | ${startDate} - ${endDate}`, x, y);
            y += TYPOGRAPHY.ENTRY_SUBHEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Achievements
            if (edu.achievements) {
              setTextStyle(doc, 'BODY');
              y = addText(doc, edu.achievements, x, y, contentWidth);
            }
            
            // Add spacing between entries (except after the last one)
            if (index < data.education.length - 1) {
              y += GRID.UNIT * GRID.SPACING.M;
            }
          });
          
          // Add consistent spacing after section
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      // CERTIFICATES
      // -----------------------------------------------
      case 'certificates':
        if (data.certificates?.length) {
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Certificates", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Render each certificate entry
          data.certificates.forEach((cert, index) => {
            // Add page break if needed
            if (y > pageHeight - GRID.MARGIN - (TYPOGRAPHY.ENTRY_HEADING.SIZE * 6)) {
              doc.addPage();
              y = margin;
            }
            
            // Certificate name
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text(cert.name, x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Institution and dates
            setTextStyle(doc, 'ENTRY_SUBHEADING');
            const acquiredDate = formatDate(cert.dateAcquired);
            let dateText = `${cert.institution} | ${acquiredDate}`;
            if (cert.expirationDate) {
              dateText += ` (Expires: ${formatDate(cert.expirationDate)})`;
            }
            doc.text(dateText, x, y);
            y += TYPOGRAPHY.ENTRY_SUBHEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Achievements
            if (cert.achievements) {
              setTextStyle(doc, 'BODY');
              y = addText(doc, cert.achievements, x, y, contentWidth);
            }
            
            // Add spacing between entries (except after the last one)
            if (index < data.certificates.length - 1) {
              y += GRID.UNIT * GRID.SPACING.M;
            }
          });
          
          // Add consistent spacing after section
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      // EXTRACURRICULAR ACTIVITIES
      // -----------------------------------------------
      case 'extracurricular':
        if (data.extracurricular?.length) {
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Extracurricular Activities", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Render each extracurricular entry
          data.extracurricular.forEach((activity, index) => {
            // Add page break if needed
            if (y > pageHeight - GRID.MARGIN - (TYPOGRAPHY.ENTRY_HEADING.SIZE * 6)) {
              doc.addPage();
              y = margin;
            }
            
            // Role
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text(activity.role, x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Organization and dates
            setTextStyle(doc, 'ENTRY_SUBHEADING');
            const startDate = formatDate(activity.startDate);
            const endDate = activity.isCurrent ? 'Present' : formatDate(activity.endDate);
            doc.text(`${activity.organization} | ${startDate} - ${endDate}`, x, y);
            y += TYPOGRAPHY.ENTRY_SUBHEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            // Description
            if (activity.description) {
              setTextStyle(doc, 'BODY');
              y = addText(doc, activity.description, x, y, contentWidth);
            }
            
            // Add spacing between entries (except after the last one)
            if (index < data.extracurricular.length - 1) {
              y += GRID.UNIT * GRID.SPACING.M;
            }
          });
          
          // Add consistent spacing after section
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      // ADDITIONAL INFORMATION
      // -----------------------------------------------
      case 'additional':
        let hasAdditionalInfo = false;
        
        // First check if we have any content to show
        if (
          (data.additional?.skills && data.additional.skills.length > 0) ||
          (data.languages && data.languages.length > 0)
        ) {
          hasAdditionalInfo = true;
          
          setTextStyle(doc, 'SECTION_HEADING');
          doc.text("Additional Information", x, y);
          y += TYPOGRAPHY.SECTION_HEADING.SIZE * 0.8;
          
          // Add separator line
          y = addSeparator(doc, x, y, contentWidth * 0.25);
          y += GRID.UNIT * GRID.SPACING.S;
          
          // Computer Skills
          if (data.additional?.skills && data.additional.skills.length > 0) {
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text("Computer Skills", x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            setTextStyle(doc, 'BODY');
            const skillsText = data.additional.skills.join(", ");
            const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
            doc.text(skillsLines, x, y);
            y += (skillsLines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
            
            // Add spacing between subsections
            y += GRID.UNIT * GRID.SPACING.S;
          }
          
          // Languages
          if (data.languages && data.languages.length > 0) {
            setTextStyle(doc, 'ENTRY_HEADING');
            doc.text("Languages", x, y);
            y += TYPOGRAPHY.ENTRY_HEADING.SIZE * TYPOGRAPHY.LINE_HEIGHT;
            
            setTextStyle(doc, 'BODY');
            const languagesText = data.languages.map(lang => 
              `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
            ).join(", ");
            
            const languagesLines = doc.splitTextToSize(languagesText, contentWidth);
            doc.text(languagesLines, x, y);
            y += (languagesLines.length * TYPOGRAPHY.BODY.SIZE * TYPOGRAPHY.LINE_HEIGHT);
          }
        }
        
        // Only add spacing if we actually rendered something
        if (hasAdditionalInfo) {
          y += GRID.UNIT * GRID.SPACING.L;
        }
        break;
      
      default:
        break;
    }
  }
  
  // Convert to buffer and return
  return Buffer.from(doc.output('arraybuffer'));
}