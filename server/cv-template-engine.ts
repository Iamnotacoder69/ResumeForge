import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import { CompleteCV } from "@shared/types";

/**
 * Precision CV Template Engine 
 * 
 * This is a completely new approach to CV generation with:
 * 1. Absolute positioning of all elements in a grid system
 * 2. Fixed section heights with consistent spacing
 * 3. Content truncation and overflow management
 * 4. Visual consistency regardless of content length
 */

// Core sizing and spacing constants
const PAGE = {
  WIDTH: 595.28, // A4 width in points
  HEIGHT: 841.89, // A4 height in points
  MARGINS: {
    TOP: 40,
    BOTTOM: 40,
    LEFT: 40, 
    RIGHT: 40
  }
};

// Content area dimensions
const CONTENT_WIDTH = PAGE.WIDTH - PAGE.MARGINS.LEFT - PAGE.MARGINS.RIGHT;

// Typography settings
const TYPOGRAPHY = {
  FONT_FAMILY: {
    BASE: "Helvetica",
    BOLD: "Helvetica-Bold",
    ITALIC: "Helvetica-Oblique"
  },
  FONT_SIZE: {
    NAME: 16,
    SECTION_TITLE: 12,
    BODY: 9.5,
    SMALL: 9
  },
  LINE_HEIGHT: 1.3
};

// Color palette
const COLORS = {
  PRIMARY: "#2c3e50", // Dark blue-grey
  ACCENT: "#3498db", // Medium blue
  TEXT: "#333333",
  LIGHT_TEXT: "#777777",
  DIVIDER: "#cccccc"
};

// Section dimensions with fixed heights
const SECTION_LAYOUT = {
  // Each section has a fixed top position and height
  HEADER: {
    TOP: PAGE.MARGINS.TOP,
    HEIGHT: 60
  },
  SUMMARY: {
    TOP: PAGE.MARGINS.TOP + 70,
    HEIGHT: 70
  },
  COMPETENCIES: {
    TOP: PAGE.MARGINS.TOP + 150,
    HEIGHT: 50
  },
  EXPERIENCE: {
    TOP: PAGE.MARGINS.TOP + 210,
    HEIGHT: 250
  },
  EDUCATION: {
    TOP: PAGE.MARGINS.TOP + 470, 
    HEIGHT: 150
  },
  CERTIFICATES: {
    TOP: PAGE.MARGINS.TOP + 630,
    HEIGHT: 100
  },
  ADDITIONAL: {
    TOP: PAGE.MARGINS.TOP + 740,
    HEIGHT: 50
  }
};

// Fixed spacing between elements
const SPACING = {
  AFTER_SECTION_TITLE: 8,
  AFTER_ENTRY_TITLE: 4,
  BETWEEN_PARAGRAPHS: 4,
  BETWEEN_ENTRIES: 8,
  BULLET_INDENT: 10
};

/**
 * Helper functions
 */

// Format a date string consistently (e.g. "Oct 2020")
function formatDate(dateStr?: string, isCurrent: boolean = false): string {
  if (isCurrent) return "Present";
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

// Truncate text to fit in available height
function truncateTextToFit(
  doc: typeof PDFDocument, 
  text: string,
  maxWidth: number,
  maxHeight: number,
  fontSize: number
): string {
  if (!text || text.trim() === "") return "";
  
  doc.fontSize(fontSize);
  const textHeight = doc.heightOfString(text, { width: maxWidth });
  
  if (textHeight <= maxHeight) {
    return text; // Text fits, no truncation needed
  }
  
  // Text is too long, we need to truncate
  // This is a simple character-based truncation approach
  const approxCharsPerLine = Math.floor(maxWidth / (fontSize * 0.5));
  const approxLinesAvailable = Math.floor(maxHeight / (fontSize * TYPOGRAPHY.LINE_HEIGHT));
  const approxTotalChars = approxCharsPerLine * approxLinesAvailable;
  
  // Try a rough estimate first (with some buffer for safety)
  let truncatedText = text.substring(0, Math.floor(approxTotalChars * 0.9)) + "...";
  
  // Fine-tune if needed through binary search
  let min = Math.floor(approxTotalChars * 0.5);
  let max = Math.floor(approxTotalChars * 1.2);
  
  while (min <= max) {
    const mid = Math.floor((min + max) / 2);
    truncatedText = text.substring(0, mid) + "...";
    const height = doc.heightOfString(truncatedText, { width: maxWidth });
    
    if (height <= maxHeight && 
        doc.heightOfString(text.substring(0, mid + 10) + "...", { width: maxWidth }) > maxHeight) {
      // We found a good fit
      break;
    } else if (height > maxHeight) {
      max = mid - 1;
    } else {
      min = mid + 1;
    }
  }
  
  return truncatedText;
}

// Extract bullet points from text
function extractBulletPoints(text: string): string[] {
  if (!text) return [];
  
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove bullet markers if present
      if (line.startsWith('•') || line.startsWith('-')) {
        return line.substring(1).trim();
      }
      return line;
    });
}

/**
 * Section rendering functions
 */

// Render a section title with consistent styling
function renderSectionTitle(
  doc: typeof PDFDocument, 
  title: string, 
  x: number, 
  y: number
): number {
  doc.font(TYPOGRAPHY.FONT_FAMILY.BOLD)
     .fontSize(TYPOGRAPHY.FONT_SIZE.SECTION_TITLE)
     .fillColor(COLORS.PRIMARY)
     .text(title, x, y, { width: CONTENT_WIDTH });
  
  // Draw title underline
  const titleWidth = doc.widthOfString(title);
  const underlineY = y + TYPOGRAPHY.FONT_SIZE.SECTION_TITLE + 2;
  
  doc.strokeColor(COLORS.ACCENT)
     .lineWidth(1.5)
     .moveTo(x, underlineY)
     .lineTo(x + CONTENT_WIDTH, underlineY)
     .stroke();
  
  return y + TYPOGRAPHY.FONT_SIZE.SECTION_TITLE + SPACING.AFTER_SECTION_TITLE;
}

// Render personal info header section
function renderHeaderSection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.HEADER.TOP;
  const headerHeight = SECTION_LAYOUT.HEADER.HEIGHT;
  
  // Name
  doc.font(TYPOGRAPHY.FONT_FAMILY.BOLD)
     .fontSize(TYPOGRAPHY.FONT_SIZE.NAME)
     .fillColor(COLORS.PRIMARY)
     .text(
       `${data.personal.firstName} ${data.personal.lastName}`,
       x, 
       y, 
       { width: CONTENT_WIDTH }
     );
  
  // Contact info
  const contactY = y + TYPOGRAPHY.FONT_SIZE.NAME + 6;
  const contactParts = [];
  
  if (data.personal.email) contactParts.push(data.personal.email);
  if (data.personal.phone) contactParts.push(data.personal.phone);
  if (data.personal.linkedin) contactParts.push(data.personal.linkedin);
  
  const contactText = contactParts.join(" | ");
  
  doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
     .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
     .fillColor(COLORS.TEXT)
     .text(contactText, x, contactY, { width: CONTENT_WIDTH });
  
  // Photo if included
  if (data.templateSettings?.includePhoto && data.personal.photoUrl) {
    try {
      if (data.personal.photoUrl.startsWith('data:image/')) {
        const base64Data = data.personal.photoUrl.split(',')[1];
        if (base64Data) {
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const imageWidth = 70;
          const imageHeight = 85;
          
          doc.image(
            imageBuffer,
            PAGE.WIDTH - PAGE.MARGINS.RIGHT - imageWidth,
            SECTION_LAYOUT.HEADER.TOP,
            { 
              fit: [imageWidth, imageHeight],
              align: 'right' 
            }
          );
        }
      }
    } catch (err) {
      console.error("Error adding photo:", err);
    }
  }
}

// Render summary section
function renderSummarySection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  if (!data.professional?.summary) return;
  
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.SUMMARY.TOP;
  const maxHeight = SECTION_LAYOUT.SUMMARY.HEIGHT - TYPOGRAPHY.FONT_SIZE.SECTION_TITLE - SPACING.AFTER_SECTION_TITLE - 5;
  
  const newY = renderSectionTitle(doc, "Professional Summary", x, y);
  
  // Truncate summary text to fit the available height
  const truncatedSummary = truncateTextToFit(
    doc,
    data.professional.summary,
    CONTENT_WIDTH,
    maxHeight,
    TYPOGRAPHY.FONT_SIZE.BODY
  );
  
  doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
     .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
     .fillColor(COLORS.TEXT)
     .text(truncatedSummary, x, newY, { width: CONTENT_WIDTH });
}

// Render competencies section
function renderCompetenciesSection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  const hasSkills = (data.keyCompetencies?.technicalSkills?.length || 0) > 0 || 
                   (data.keyCompetencies?.softSkills?.length || 0) > 0;
  
  if (!hasSkills) return;
  
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.COMPETENCIES.TOP;
  const maxHeight = SECTION_LAYOUT.COMPETENCIES.HEIGHT - TYPOGRAPHY.FONT_SIZE.SECTION_TITLE - SPACING.AFTER_SECTION_TITLE - 5;
  
  const newY = renderSectionTitle(doc, "Key Competencies", x, y);
  
  // Combine all skills
  const technicalSkills = data.keyCompetencies?.technicalSkills || [];
  const softSkills = data.keyCompetencies?.softSkills || [];
  
  // Format as two distinct sections
  let skillsText = "";
  
  if (technicalSkills.length > 0) {
    skillsText += "Technical: " + technicalSkills.join(", ");
  }
  
  if (softSkills.length > 0) {
    if (skillsText) skillsText += "\n";
    skillsText += "Soft Skills: " + softSkills.join(", ");
  }
  
  // Truncate to fit
  const truncatedSkills = truncateTextToFit(
    doc,
    skillsText,
    CONTENT_WIDTH,
    maxHeight,
    TYPOGRAPHY.FONT_SIZE.BODY
  );
  
  doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
     .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
     .fillColor(COLORS.TEXT)
     .text(truncatedSkills, x, newY, { width: CONTENT_WIDTH });
}

// Render experience section
function renderExperienceSection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  if (!data.experience?.length) return;
  
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.EXPERIENCE.TOP;
  
  const newY = renderSectionTitle(doc, "Professional Experience", x, y);
  
  // Calculate available height for entries
  const availableHeight = SECTION_LAYOUT.EXPERIENCE.HEIGHT - (newY - y) - 5;
  
  // Determine height per entry based on number of entries (max 4)
  const entries = data.experience.slice(0, 4); // Limit to 4 entries
  const heightPerEntry = availableHeight / entries.length;
  
  // Render each experience entry
  entries.forEach((exp, index) => {
    const entryY = newY + (index * heightPerEntry);
    const jobTitleY = entryY;
    
    // Job title with date on right
    doc.font(TYPOGRAPHY.FONT_FAMILY.BOLD)
       .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
       .fillColor(COLORS.PRIMARY);
    
    // Job title on left
    const jobTitle = exp.jobTitle || "";
    doc.text(jobTitle, x, jobTitleY, { 
      width: CONTENT_WIDTH - 120, // Leave space for date
      continued: false 
    });
    
    // Date range on right
    const startDate = formatDate(exp.startDate);
    const endDate = exp.isCurrent ? "Present" : formatDate(exp.endDate);
    const dateText = `${startDate} - ${endDate}`;
    
    doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
       .fontSize(TYPOGRAPHY.FONT_SIZE.SMALL)
       .fillColor(COLORS.LIGHT_TEXT)
       .text(
         dateText, 
         x + CONTENT_WIDTH - doc.widthOfString(dateText),  
         jobTitleY, 
         { align: 'right' }
       );
    
    // Company name
    const companyY = jobTitleY + TYPOGRAPHY.FONT_SIZE.BODY * TYPOGRAPHY.LINE_HEIGHT;
    
    doc.font(TYPOGRAPHY.FONT_FAMILY.ITALIC)
       .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
       .fillColor(COLORS.TEXT)
       .text(exp.companyName || "", x, companyY);
    
    // Responsibilities - as bullet points
    const bulletPointsY = companyY + TYPOGRAPHY.FONT_SIZE.BODY * TYPOGRAPHY.LINE_HEIGHT + 2;
    
    if (exp.responsibilities) {
      const bullets = extractBulletPoints(exp.responsibilities);
      const maxBullets = 3; // Limit to 3 bullet points per entry
      
      // Calculate space for bullet points
      const bulletPointsHeight = heightPerEntry - 
        (bulletPointsY - entryY) - 
        SPACING.BETWEEN_ENTRIES;
      
      // Height per bullet point
      const heightPerBullet = bulletPointsHeight / maxBullets;
      
      // Display bullet points
      bullets.slice(0, maxBullets).forEach((bullet, i) => {
        const bulletY = bulletPointsY + (i * heightPerBullet);
        
        // Add bullet marker
        doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
           .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
           .fillColor(COLORS.ACCENT)
           .text("•", x, bulletY);
        
        // Add bullet text
        const maxBulletWidth = CONTENT_WIDTH - SPACING.BULLET_INDENT;
        const maxBulletHeight = heightPerBullet - 2;
        
        const truncatedBullet = truncateTextToFit(
          doc,
          bullet,
          maxBulletWidth,
          maxBulletHeight,
          TYPOGRAPHY.FONT_SIZE.BODY
        );
        
        doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
           .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
           .fillColor(COLORS.TEXT)
           .text(
             truncatedBullet, 
             x + SPACING.BULLET_INDENT, 
             bulletY,
             { width: maxBulletWidth }
           );
      });
    }
  });
}

// Render education section
function renderEducationSection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  if (!data.education?.length) return;
  
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.EDUCATION.TOP;
  
  const newY = renderSectionTitle(doc, "Education", x, y);
  
  // Calculate available height for entries
  const availableHeight = SECTION_LAYOUT.EDUCATION.HEIGHT - (newY - y) - 5;
  
  // Determine height per entry based on number of entries (max 3)
  const entries = data.education.slice(0, 3); // Limit to 3 entries
  const heightPerEntry = availableHeight / entries.length;
  
  // Render each education entry
  entries.forEach((edu, index) => {
    const entryY = newY + (index * heightPerEntry);
    const degreeY = entryY;
    
    // Degree with date on right
    doc.font(TYPOGRAPHY.FONT_FAMILY.BOLD)
       .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
       .fillColor(COLORS.PRIMARY);
    
    // Degree on left
    const degree = edu.major || "";
    doc.text(degree, x, degreeY, { 
      width: CONTENT_WIDTH - 100, // Leave space for date
      continued: false 
    });
    
    // Graduation date on right
    const gradDate = formatDate(edu.endDate);
    
    doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
       .fontSize(TYPOGRAPHY.FONT_SIZE.SMALL)
       .fillColor(COLORS.LIGHT_TEXT)
       .text(
         gradDate, 
         x + CONTENT_WIDTH - doc.widthOfString(gradDate),  
         degreeY, 
         { align: 'right' }
       );
    
    // School name
    const schoolY = degreeY + TYPOGRAPHY.FONT_SIZE.BODY * TYPOGRAPHY.LINE_HEIGHT;
    
    doc.font(TYPOGRAPHY.FONT_FAMILY.ITALIC)
       .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
       .fillColor(COLORS.TEXT)
       .text(edu.schoolName || "", x, schoolY);
    
    // Achievements (if any)
    if (edu.achievements) {
      const achievementsY = schoolY + TYPOGRAPHY.FONT_SIZE.BODY * TYPOGRAPHY.LINE_HEIGHT + 2;
      
      // Max height for achievements
      const maxAchievementsHeight = heightPerEntry - 
        (achievementsY - entryY) - 
        SPACING.BETWEEN_ENTRIES;
      
      const truncatedAchievements = truncateTextToFit(
        doc,
        edu.achievements,
        CONTENT_WIDTH,
        maxAchievementsHeight,
        TYPOGRAPHY.FONT_SIZE.BODY
      );
      
      doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
         .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
         .fillColor(COLORS.TEXT)
         .text(
           truncatedAchievements, 
           x, 
           achievementsY,
           { width: CONTENT_WIDTH }
         );
    }
  });
}

// Render certificates section
function renderCertificatesSection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  if (!data.certificates?.length) return;
  
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.CERTIFICATES.TOP;
  
  const newY = renderSectionTitle(doc, "Certifications", x, y);
  
  // Calculate available height for entries
  const availableHeight = SECTION_LAYOUT.CERTIFICATES.HEIGHT - (newY - y) - 5;
  
  // Determine height per entry based on number of entries (max 2)
  const entries = data.certificates.slice(0, 2); // Limit to 2 entries
  const heightPerEntry = availableHeight / entries.length;
  
  // Render each certificate entry
  entries.forEach((cert, index) => {
    const entryY = newY + (index * heightPerEntry);
    const certNameY = entryY;
    
    // Certificate name with date on right
    doc.font(TYPOGRAPHY.FONT_FAMILY.BOLD)
       .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
       .fillColor(COLORS.PRIMARY);
    
    // Certificate name on left
    const certName = cert.name || "";
    doc.text(certName, x, certNameY, { 
      width: CONTENT_WIDTH - 100, // Leave space for date
      continued: false 
    });
    
    // Date on right
    const certDate = formatDate(cert.dateAcquired);
    
    doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
       .fontSize(TYPOGRAPHY.FONT_SIZE.SMALL)
       .fillColor(COLORS.LIGHT_TEXT)
       .text(
         certDate, 
         x + CONTENT_WIDTH - doc.widthOfString(certDate),  
         certNameY, 
         { align: 'right' }
       );
    
    // Institution
    const institutionY = certNameY + TYPOGRAPHY.FONT_SIZE.BODY * TYPOGRAPHY.LINE_HEIGHT;
    
    doc.font(TYPOGRAPHY.FONT_FAMILY.ITALIC)
       .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
       .fillColor(COLORS.TEXT)
       .text(cert.institution || "", x, institutionY);
  });
}

// Render additional info section
function renderAdditionalSection(
  doc: typeof PDFDocument, 
  data: CompleteCV
): void {
  const hasLanguages = (data.languages?.length || 0) > 0;
  const hasSkills = (data.additional?.skills?.length || 0) > 0;
  
  if (!hasLanguages && !hasSkills) return;
  
  const x = PAGE.MARGINS.LEFT;
  const y = SECTION_LAYOUT.ADDITIONAL.TOP;
  
  const newY = renderSectionTitle(doc, "Additional Information", x, y);
  
  // Create combined text
  let additionalText = "";
  
  // Add languages
  if (hasLanguages) {
    const languages = data.languages!.map(
      lang => `${lang.name} (${lang.proficiency})`
    ).join(", ");
    
    additionalText += `Languages: ${languages}`;
  }
  
  // Add skills
  if (hasSkills) {
    if (additionalText) additionalText += "\n";
    additionalText += `Additional Skills: ${data.additional!.skills.join(", ")}`;
  }
  
  // Calculate max height
  const maxHeight = SECTION_LAYOUT.ADDITIONAL.HEIGHT - (newY - y) - 5;
  
  // Truncate if needed
  const truncatedText = truncateTextToFit(
    doc,
    additionalText,
    CONTENT_WIDTH,
    maxHeight,
    TYPOGRAPHY.FONT_SIZE.BODY
  );
  
  doc.font(TYPOGRAPHY.FONT_FAMILY.BASE)
     .fontSize(TYPOGRAPHY.FONT_SIZE.BODY)
     .fillColor(COLORS.TEXT)
     .text(truncatedText, x, newY, { width: CONTENT_WIDTH });
}

/**
 * Main CV generation function
 */
export async function generatePrecisionCV(data: CompleteCV): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 0, // We'll handle margins manually
        bufferPages: true
      });
      
      // Collect PDF output
      const chunks: Buffer[] = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      
      // Render each section
      renderHeaderSection(doc, data);
      renderSummarySection(doc, data);
      renderCompetenciesSection(doc, data);
      renderExperienceSection(doc, data);
      renderEducationSection(doc, data);
      renderCertificatesSection(doc, data);
      renderAdditionalSection(doc, data);
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error("Error generating CV:", error);
      reject(error);
    }
  });
}