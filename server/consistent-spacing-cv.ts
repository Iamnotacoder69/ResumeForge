import PDFDocument from "pdfkit";
import { CompleteCV } from "@shared/types";
import { Buffer } from "buffer";

/**
 * A CV generator with consistent spacing using dynamic text height calculations
 * This ensures proper spacing between all sections regardless of content length
 */

// Define consistent spacing constants
const SECTION_SPACING = 30; // Standard spacing between sections
const ENTRY_SPACING = 15;   // Spacing between entries within a section
const LIST_ITEM_SPACING = 5; // Spacing between list items
const BULLET_INDENT = 15;   // Indentation for bullet points

// PDF configuration
const PDF_CONFIG = {
  // Page settings
  PAGE: {
    SIZE: "A4" as const,
    MARGIN: {
      TOP: 40,
      BOTTOM: 40,
      LEFT: 40, 
      RIGHT: 40
    }
  },
  // Fonts and typography
  FONT: {
    DEFAULT: "Helvetica",
    DEFAULT_BOLD: "Helvetica-Bold",
    DEFAULT_ITALIC: "Helvetica-Oblique",
    DEFAULT_BOLD_ITALIC: "Helvetica-BoldOblique"
  },
  FONT_SIZE: {
    NAME: 18,
    SECTION_TITLE: 12,
    ENTRY_TITLE: 11,
    NORMAL: 10,
    SMALL: 9
  },
  // Colors
  COLOR: {
    TEXT: "#333333",
    HEADING: "#222222",
    LINE: "#555555",
    HIGHLIGHT: "#3366cc"
  },
  // Image settings for photo
  IMAGE: {
    WIDTH: 80,
    HEIGHT: 100,
    POSITION: {
      X: 480,
      Y: 40
    }
  }
};

/**
 * Generate a CV with consistent spacing using dynamic text height calculations
 */
export async function generateConsistentSpacingCV(data: CompleteCV): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: PDF_CONFIG.PAGE.SIZE,
        margin: 0, // We'll manage margins manually
        bufferPages: true
      });

      // Collect PDF chunks
      const chunks: Buffer[] = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      // Page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = PDF_CONFIG.PAGE.MARGIN;
      const contentWidth = pageWidth - margin.LEFT - margin.RIGHT;

      // Current Y position tracker
      let y = margin.TOP;

      // Helper functions
      
      /**
       * Add section title with consistent formatting
       */
      const addSectionTitle = (title: string, currentY: number): number => {
        // Add section title
        doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
           .fontSize(PDF_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(PDF_CONFIG.COLOR.HEADING)
           .text(title, margin.LEFT, currentY);
        
        // Calculate height of the title
        const titleHeight = doc.heightOfString(title, {
          width: contentWidth
        });
        currentY += titleHeight + 2; // Add a small space before separator
        
        // Add separator line
        doc.strokeColor(PDF_CONFIG.COLOR.LINE)
           .lineWidth(1)
           .moveTo(margin.LEFT, currentY)
           .lineTo(pageWidth - margin.RIGHT, currentY)
           .stroke();
        
        return currentY + 10; // Return the new Y position after title
      };
      
      /**
       * Format date string consistently
       */
      const formatDate = (dateStr?: string, isCurrent: boolean = false): string => {
        if (isCurrent) return "Present";
        if (!dateStr) return "";
        
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        } catch (e) {
          return dateStr;
        }
      };
      
      /**
       * Check if a page break is needed and add a new page if necessary
       */
      const checkPageBreak = (currentY: number, requiredHeight: number): number => {
        if (currentY + requiredHeight > pageHeight - margin.BOTTOM) {
          doc.addPage();
          return margin.TOP;
        }
        return currentY;
      };
      
      /**
       * Add bullet point text with proper indentation and return new Y position
       */
      const addBulletPoint = (text: string, currentY: number): number => {
        if (!text.trim()) return currentY;
        
        // Draw bullet
        doc.font(PDF_CONFIG.FONT.DEFAULT)
           .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
           .fillColor(PDF_CONFIG.COLOR.TEXT)
           .text("•", margin.LEFT, currentY);
        
        // Add indented text after bullet
        const updatedY = doc.y;
        doc.text(text, margin.LEFT + BULLET_INDENT, updatedY, {
          width: contentWidth - BULLET_INDENT,
          continued: false
        });
        
        // Calculate height of the bullet point text
        const textHeight = doc.y - updatedY;
        return doc.y + LIST_ITEM_SPACING;
      };

      // HEADER SECTION (always included)
      // Photo handling
      if (data.templateSettings?.includePhoto && data.personal.photoUrl) {
        try {
          // Extract base64 data
          const photoUrl = data.personal.photoUrl;
          if (photoUrl.startsWith('data:image/')) {
            const base64Data = photoUrl.split(',')[1];
            if (base64Data) {
              const imageBuffer = Buffer.from(base64Data, 'base64');
              doc.image(
                imageBuffer,
                PDF_CONFIG.IMAGE.POSITION.X,
                PDF_CONFIG.IMAGE.POSITION.Y,
                {
                  fit: [PDF_CONFIG.IMAGE.WIDTH, PDF_CONFIG.IMAGE.HEIGHT],
                  align: 'right'
                }
              );
            }
          }
        } catch (err) {
          console.error("Error adding photo:", err);
        }
      }

      // Name (full name prominent at top)
      doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
         .fontSize(PDF_CONFIG.FONT_SIZE.NAME)
         .fillColor(PDF_CONFIG.COLOR.HEADING)
         .text(`${data.personal.firstName} ${data.personal.lastName}`, margin.LEFT, y);
      
      // Calculate height of name and move Y position
      const nameHeight = doc.heightOfString(
        `${data.personal.firstName} ${data.personal.lastName}`,
        { width: contentWidth }
      );
      y += nameHeight + 5;
      
      // Separator line
      doc.strokeColor(PDF_CONFIG.COLOR.LINE)
         .lineWidth(1)
         .moveTo(margin.LEFT, y)
         .lineTo(pageWidth - margin.RIGHT, y)
         .stroke();
      y += 5;
      
      // Contact info
      const contactParts = [];
      if (data.personal.email) contactParts.push(data.personal.email);
      if (data.personal.phone) contactParts.push(data.personal.phone);
      if (data.personal.linkedin) contactParts.push(data.personal.linkedin);
      
      const contactText = contactParts.join(" | ");
      doc.font(PDF_CONFIG.FONT.DEFAULT)
         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
         .fillColor(PDF_CONFIG.COLOR.TEXT)
         .text(contactText, margin.LEFT, y);
      
      // Calculate height of contact info
      const contactHeight = doc.heightOfString(contactText, { width: contentWidth });
      y += contactHeight + SECTION_SPACING;
      
      // SUMMARY SECTION
      if (data.professional?.summary) {
        // Check if we need a page break
        y = checkPageBreak(y, 100); // Estimate height for summary
        
        // Add section title
        y = addSectionTitle("Professional Summary", y);
        
        // Add summary text
        doc.font(PDF_CONFIG.FONT.DEFAULT)
           .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
           .fillColor(PDF_CONFIG.COLOR.TEXT)
           .text(data.professional.summary, margin.LEFT, y, {
             width: contentWidth,
             align: "left"
           });
        
        // Calculate height and update Y position
        const summaryHeight = doc.heightOfString(data.professional.summary, { width: contentWidth });
        y += summaryHeight + SECTION_SPACING;
      }
      
      // KEY COMPETENCIES SECTION
      const hasSkills = !!(data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length);
      if (hasSkills) {
        // Check if we need a page break
        y = checkPageBreak(y, 100); // Estimate height for competencies
        
        // Add section title
        y = addSectionTitle("Key Competencies", y);
        
        // Combined skills
        const allSkills = [
          ...(data.keyCompetencies?.technicalSkills || []),
          ...(data.keyCompetencies?.softSkills || [])
        ];
        
        if (allSkills.length > 0) {
          const skillsText = allSkills.join(", ");
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(skillsText, margin.LEFT, y, {
               width: contentWidth,
               align: "left"
             });
          
          // Calculate height and update Y position
          const skillsHeight = doc.heightOfString(skillsText, { width: contentWidth });
          y += skillsHeight + SECTION_SPACING;
        }
      }
      
      // EXPERIENCE SECTION
      if (data.experience?.length) {
        // Check if we need a page break
        y = checkPageBreak(y, 120); // Estimate minimum height for experience section
        
        // Add section title
        y = addSectionTitle("Professional Experience", y);
        
        // Process experience entries
        data.experience.forEach((exp, index) => {
          // Job title
          doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
             .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(PDF_CONFIG.COLOR.HEADING)
             .text(exp.jobTitle, margin.LEFT, y);
          
          // Date on the right
          const startDate = formatDate(exp.startDate);
          const endDate = exp.isCurrent ? "Present" : formatDate(exp.endDate);
          const dateText = `${startDate} - ${endDate}`;
          
          const dateWidth = doc.widthOfString(dateText);
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(dateText, pageWidth - margin.RIGHT - dateWidth, y);
          
          // Calculate height of job title line
          const titleHeight = Math.max(
            doc.heightOfString(exp.jobTitle, { width: contentWidth / 2 }),
            doc.heightOfString(dateText, { width: contentWidth / 2 })
          );
          y += titleHeight + 3;
          
          // Company name
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(exp.companyName, margin.LEFT, y);
          
          // Calculate company name height
          const companyHeight = doc.heightOfString(exp.companyName, { width: contentWidth });
          y += companyHeight + 5;
          
          // Process responsibilities with bullet points
          if (exp.responsibilities) {
            const paragraphs = exp.responsibilities.split('\n');
            paragraphs.forEach((paragraph) => {
              if (!paragraph.trim()) return;
              
              // Format bullet points
              if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                const cleanText = paragraph.trim().substring(1).trim();
                y = addBulletPoint(cleanText, y);
              } else {
                // Regular paragraph
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(paragraph, margin.LEFT, y, {
                     width: contentWidth,
                     align: "left"
                   });
                
                const paraHeight = doc.heightOfString(paragraph, { width: contentWidth });
                y += paraHeight + LIST_ITEM_SPACING;
              }
            });
          }
          
          // Add space between entries (except after the last one)
          if (index < data.experience.length - 1) {
            y += ENTRY_SPACING;
          }
        });
        
        // Add section spacing after experience
        y += SECTION_SPACING;
      }
      
      // EDUCATION SECTION
      if (data.education?.length) {
        // Check if we need a page break
        y = checkPageBreak(y, 120); // Estimate minimum height for education section
        
        // Add section title
        y = addSectionTitle("Education", y);
        
        // Process education entries
        data.education.forEach((edu, index) => {
          // Degree with date on the right
          doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
             .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(PDF_CONFIG.COLOR.HEADING)
             .text(edu.major, margin.LEFT, y);
          
          // Graduation date on the right
          const gradDate = formatDate(edu.endDate);
          
          const dateWidth = doc.widthOfString(gradDate);
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(gradDate, pageWidth - margin.RIGHT - dateWidth, y);
          
          // Calculate height of degree line
          const titleHeight = Math.max(
            doc.heightOfString(edu.major, { width: contentWidth / 2 }),
            doc.heightOfString(gradDate, { width: contentWidth / 2 })
          );
          y += titleHeight + 3;
          
          // School name
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(edu.schoolName, margin.LEFT, y);
          
          // Calculate school name height
          const schoolHeight = doc.heightOfString(edu.schoolName, { width: contentWidth });
          y += schoolHeight + 5;
          
          // Add achievements if any
          if (edu.achievements) {
            const paragraphs = edu.achievements.split('\n');
            paragraphs.forEach((paragraph) => {
              if (!paragraph.trim()) return;
              
              // Format bullet points
              if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                const cleanText = paragraph.trim().substring(1).trim();
                y = addBulletPoint(cleanText, y);
              } else {
                // Regular paragraph
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(paragraph, margin.LEFT, y, {
                     width: contentWidth,
                     align: "left"
                   });
                
                const paraHeight = doc.heightOfString(paragraph, { width: contentWidth });
                y += paraHeight + LIST_ITEM_SPACING;
              }
            });
          }
          
          // Add space between entries (except after the last one)
          if (index < data.education.length - 1) {
            y += ENTRY_SPACING;
          }
        });
        
        // Add section spacing after education
        y += SECTION_SPACING;
      }
      
      // CERTIFICATES SECTION
      if (data.certificates?.length) {
        // Check if we need a page break
        y = checkPageBreak(y, 120); // Estimate minimum height for certificates section
        
        // Add section title
        y = addSectionTitle("Certifications", y);
        
        // Process certificate entries
        data.certificates.forEach((cert, index) => {
          // Certificate name with date on the right
          doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
             .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(PDF_CONFIG.COLOR.HEADING)
             .text(cert.name, margin.LEFT, y);
          
          // Date on the right
          const certDate = formatDate(cert.dateAcquired);
          
          const dateWidth = doc.widthOfString(certDate);
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(certDate, pageWidth - margin.RIGHT - dateWidth, y);
          
          // Calculate height of certificate name line
          const titleHeight = Math.max(
            doc.heightOfString(cert.name, { width: contentWidth / 2 }),
            doc.heightOfString(certDate, { width: contentWidth / 2 })
          );
          y += titleHeight + 3;
          
          // Institution name
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(cert.institution, margin.LEFT, y);
          
          // Calculate institution name height
          const instHeight = doc.heightOfString(cert.institution, { width: contentWidth });
          y += instHeight + 5;
          
          // Add achievements if any
          if (cert.achievements) {
            const paragraphs = cert.achievements.split('\n');
            paragraphs.forEach((paragraph) => {
              if (!paragraph.trim()) return;
              
              // Format bullet points
              if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                const cleanText = paragraph.trim().substring(1).trim();
                y = addBulletPoint(cleanText, y);
              } else {
                // Regular paragraph
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(paragraph, margin.LEFT, y, {
                     width: contentWidth,
                     align: "left"
                   });
                
                const paraHeight = doc.heightOfString(paragraph, { width: contentWidth });
                y += paraHeight + LIST_ITEM_SPACING;
              }
            });
          }
          
          // Add space between entries (except after the last one)
          if (index < data.certificates.length - 1) {
            y += ENTRY_SPACING;
          }
        });
        
        // Add section spacing after certificates
        y += SECTION_SPACING;
      }
      
      // EXTRACURRICULAR ACTIVITIES SECTION
      if (data.extracurricular?.length) {
        // Check if we need a page break
        y = checkPageBreak(y, 120); // Estimate minimum height for extracurricular section
        
        // Add section title
        y = addSectionTitle("Extracurricular Activities", y);
        
        // Process extracurricular entries
        data.extracurricular.forEach((extra, index) => {
          // Role with dates on the right
          doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
             .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(PDF_CONFIG.COLOR.HEADING)
             .text(extra.role, margin.LEFT, y);
          
          // Date on the right
          const startDate = formatDate(extra.startDate);
          const endDate = extra.isCurrent ? "Present" : formatDate(extra.endDate);
          const dateText = `${startDate} - ${endDate}`;
          
          const dateWidth = doc.widthOfString(dateText);
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(dateText, pageWidth - margin.RIGHT - dateWidth, y);
          
          // Calculate height of role line
          const titleHeight = Math.max(
            doc.heightOfString(extra.role, { width: contentWidth / 2 }),
            doc.heightOfString(dateText, { width: contentWidth / 2 })
          );
          y += titleHeight + 3;
          
          // Organization name
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(extra.organization, margin.LEFT, y);
          
          // Calculate organization name height
          const orgHeight = doc.heightOfString(extra.organization, { width: contentWidth });
          y += orgHeight + 5;
          
          // Description
          if (extra.description) {
            const paragraphs = extra.description.split('\n');
            paragraphs.forEach((paragraph) => {
              if (!paragraph.trim()) return;
              
              // Format bullet points
              if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                const cleanText = paragraph.trim().substring(1).trim();
                y = addBulletPoint(cleanText, y);
              } else {
                // Regular paragraph
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(paragraph, margin.LEFT, y, {
                     width: contentWidth,
                     align: "left"
                   });
                
                const paraHeight = doc.heightOfString(paragraph, { width: contentWidth });
                y += paraHeight + LIST_ITEM_SPACING;
              }
            });
          }
          
          // Add space between entries (except after the last one)
          if (index < data.extracurricular.length - 1) {
            y += ENTRY_SPACING;
          }
        });
        
        // Add section spacing after extracurricular
        y += SECTION_SPACING;
      }
      
      // ADDITIONAL INFORMATION SECTION
      const hasLanguages = data.languages?.length > 0;
      const hasAdditionalSkills = data.additional?.skills?.length > 0;
      
      if (hasLanguages || hasAdditionalSkills) {
        // Check if we need a page break
        y = checkPageBreak(y, 100); // Estimate minimum height for additional section
        
        // Add section title
        y = addSectionTitle("Additional Information", y);
        
        // Languages
        if (hasLanguages) {
          doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.HEADING)
             .text("Languages:", margin.LEFT, y);
          
          const langText = data.languages!.map(lang => 
            `${lang.name} (${lang.proficiency})`
          ).join(", ");
          
          const langLabelWidth = doc.widthOfString("Languages: ");
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(langText, margin.LEFT + langLabelWidth, y, {
               width: contentWidth - langLabelWidth,
               continued: false
             });
          
          // Calculate text height
          const langHeight = doc.heightOfString(langText, { 
            width: contentWidth - langLabelWidth
          });
          y += langHeight + 5;
        }
        
        // Additional skills
        if (hasAdditionalSkills) {
          doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.HEADING)
             .text("Skills:", margin.LEFT, y);
          
          const skillsText = (data.additional!.skills || []).join(", ");
          
          const skillLabelWidth = doc.widthOfString("Skills: ");
          doc.font(PDF_CONFIG.FONT.DEFAULT)
             .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(PDF_CONFIG.COLOR.TEXT)
             .text(skillsText, margin.LEFT + skillLabelWidth, y, {
               width: contentWidth - skillLabelWidth,
               continued: false
             });
          
          // Calculate text height
          const skillsHeight = doc.heightOfString(skillsText, { 
            width: contentWidth - skillLabelWidth
          });
          y += skillsHeight;
        }
      }
      
      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error("Error generating consistent spacing CV:", error);
      reject(error);
    }
  });
}