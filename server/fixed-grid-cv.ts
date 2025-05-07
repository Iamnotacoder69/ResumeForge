import PDFDocument from "pdfkit";
import { Buffer } from "buffer";
import { CompleteCV } from "@shared/types";

/**
 * A fixed-grid CV template with absolute positioning
 * This template maintains consistent spacing regardless of content length
 */

// Fixed-grid PDF configuration
const GRID_CONFIG = {
  // Page settings (72 points = 1 inch)
  PAGE: {
    SIZE: "A4" as const,
    WIDTH: 595.28,  // A4 width in points
    HEIGHT: 841.89, // A4 height in points
    MARGIN: {
      TOP: 50,
      BOTTOM: 50,
      LEFT: 50,
      RIGHT: 50
    }
  },
  // Fonts and typography
  FONT: {
    PRIMARY: "Helvetica",
    PRIMARY_BOLD: "Helvetica-Bold",
    SECONDARY: "Helvetica-Oblique",
    SECONDARY_BOLD: "Helvetica-BoldOblique"
  },
  FONT_SIZE: {
    NAME: 18,
    SECTION_TITLE: 12,
    ENTRY_TITLE: 10,
    NORMAL: 10,
    SMALL: 9
  },
  // Fixed section positions (y-coordinates from top)
  SECTION: {
    HEADER: {
      START: 50,
      HEIGHT: 80
    },
    SUMMARY: {
      START: 140,
      HEIGHT: 80
    },
    COMPETENCIES: {
      START: 230,
      HEIGHT: 60
    },
    EXPERIENCE: {
      START: 300,
      HEIGHT: 200
    },
    EDUCATION: {
      START: 510,
      HEIGHT: 130
    },
    CERTIFICATES: {
      START: 650,
      HEIGHT: 130
    },
    ADDITIONAL: {
      START: 790,
      HEIGHT: 40
    }
  },
  // Colors
  COLOR: {
    PRIMARY: "#2c3e50",    // Dark blue-gray
    SECONDARY: "#3498db",  // Bright blue
    TEXT: "#333333",       // Dark gray
    LIGHT_TEXT: "#7f8c8d", // Light gray
    ACCENT: "#e74c3c"      // Red accent
  },
  // Image settings
  IMAGE: {
    WIDTH: 70,
    HEIGHT: 90,
    POSITION: {
      X: 475,
      Y: 50
    }
  }
};

/**
 * Helper to truncate text to fit in available space
 * @param text Text to truncate
 * @param maxLength Maximum length in characters
 * @param suffix Suffix to add at the end of truncated text
 */
function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Helper to format dates consistently
 */
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

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  if (!text) return [];
  
  const lines = text.split('\n');
  return lines
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
 * Generate a fixed-grid CV with absolute positioning
 */
export async function generateFixedGridCV(data: CompleteCV): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create document
      const doc = new PDFDocument({
        size: GRID_CONFIG.PAGE.SIZE,
        margin: 0, // Using manual margins for absolute positioning
        bufferPages: true
      });

      // Collect PDF output chunks
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Page dimensions
      const margin = GRID_CONFIG.PAGE.MARGIN;
      const contentWidth = GRID_CONFIG.PAGE.WIDTH - margin.LEFT - margin.RIGHT;

      // Determine which sections to include based on data
      const includeSummary = !!data.professional?.summary;
      const includeCompetencies = !!(data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length);
      const includeExperience = !!data.experience?.length;
      const includeEducation = !!data.education?.length;
      const includeCertificates = !!data.certificates?.length;
      const includeAdditional = !!(data.languages?.length || data.additional?.skills?.length);

      // HEADER SECTION
      // ==============
      // Photo (if included)
      if (data.templateSettings?.includePhoto && data.personal.photoUrl) {
        try {
          if (data.personal.photoUrl.startsWith('data:image/')) {
            const base64Data = data.personal.photoUrl.split(',')[1];
            if (base64Data) {
              const imageBuffer = Buffer.from(base64Data, 'base64');
              doc.image(
                imageBuffer,
                GRID_CONFIG.IMAGE.POSITION.X,
                GRID_CONFIG.IMAGE.POSITION.Y,
                {
                  fit: [GRID_CONFIG.IMAGE.WIDTH, GRID_CONFIG.IMAGE.HEIGHT],
                  align: 'right'
                }
              );
            }
          }
        } catch (err) {
          console.error("Error adding photo:", err);
        }
      }

      // Name
      doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
         .fontSize(GRID_CONFIG.FONT_SIZE.NAME)
         .fillColor(GRID_CONFIG.COLOR.PRIMARY)
         .text(
           `${data.personal.firstName} ${data.personal.lastName}`,
           margin.LEFT,
           GRID_CONFIG.SECTION.HEADER.START,
           { width: contentWidth - 100 } // Leave space for photo
         );

      // Contact details
      const contactParts = [];
      if (data.personal.email) contactParts.push(data.personal.email);
      if (data.personal.phone) contactParts.push(data.personal.phone);
      if (data.personal.linkedin) contactParts.push(data.personal.linkedin);
      
      doc.font(GRID_CONFIG.FONT.PRIMARY)
         .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
         .fillColor(GRID_CONFIG.COLOR.TEXT)
         .text(
           contactParts.join(" | "),
           margin.LEFT,
           GRID_CONFIG.SECTION.HEADER.START + 30,
           { width: contentWidth - 100 }
         );

      // Divider line
      doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
         .lineWidth(1)
         .moveTo(margin.LEFT, GRID_CONFIG.SECTION.HEADER.START + 60)
         .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.HEADER.START + 60)
         .stroke();

      // SUMMARY SECTION
      // ==============
      if (includeSummary) {
        // Section title
        doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
           .fontSize(GRID_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(GRID_CONFIG.COLOR.PRIMARY)
           .text(
             "Professional Summary",
             margin.LEFT,
             GRID_CONFIG.SECTION.SUMMARY.START
           );

        // Divider line
        doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
           .lineWidth(0.5)
           .moveTo(margin.LEFT, GRID_CONFIG.SECTION.SUMMARY.START + 18)
           .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.SUMMARY.START + 18)
           .stroke();

        // Summary text - truncate if too long
        doc.font(GRID_CONFIG.FONT.PRIMARY)
           .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
           .fillColor(GRID_CONFIG.COLOR.TEXT);
        
        // Calculate available height
        const availableHeight = GRID_CONFIG.SECTION.SUMMARY.HEIGHT - 25;
        const linesCapacity = Math.floor(availableHeight / (GRID_CONFIG.FONT_SIZE.NORMAL * 1.3));
        
        // Split text into lines for controlled display
        let summaryText = data.professional?.summary || "";
        const summaryLines = doc.heightOfString(summaryText, { width: contentWidth }) / (GRID_CONFIG.FONT_SIZE.NORMAL * 1.3);
        
        if (summaryLines > linesCapacity) {
          // Truncate based on approximate character count
          const averageCharsPerLine = Math.ceil(summaryText.length / summaryLines);
          const maxChars = averageCharsPerLine * linesCapacity;
          summaryText = truncateText(summaryText, maxChars);
        }
        
        doc.text(
          summaryText,
          margin.LEFT,
          GRID_CONFIG.SECTION.SUMMARY.START + 25,
          { width: contentWidth }
        );
      }

      // KEY COMPETENCIES SECTION
      // =======================
      if (includeCompetencies) {
        // Section title
        doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
           .fontSize(GRID_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(GRID_CONFIG.COLOR.PRIMARY)
           .text(
             "Key Competencies",
             margin.LEFT,
             GRID_CONFIG.SECTION.COMPETENCIES.START
           );

        // Divider line
        doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
           .lineWidth(0.5)
           .moveTo(margin.LEFT, GRID_CONFIG.SECTION.COMPETENCIES.START + 18)
           .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.COMPETENCIES.START + 18)
           .stroke();

        // All skills combined
        const allSkills = [
          ...(data.keyCompetencies?.technicalSkills || []),
          ...(data.keyCompetencies?.softSkills || [])
        ];
        
        // Format skills with limited character count
        const maxSkillsText = Math.floor(contentWidth / 5); // Approx character estimate
        let skillsText = allSkills.join(", ");
        
        if (skillsText.length > maxSkillsText) {
          skillsText = truncateText(skillsText, maxSkillsText);
        }
        
        doc.font(GRID_CONFIG.FONT.PRIMARY)
           .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
           .fillColor(GRID_CONFIG.COLOR.TEXT)
           .text(
             skillsText,
             margin.LEFT,
             GRID_CONFIG.SECTION.COMPETENCIES.START + 25,
             { width: contentWidth }
           );
      }

      // EXPERIENCE SECTION
      // =================
      if (includeExperience) {
        // Section title
        doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
           .fontSize(GRID_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(GRID_CONFIG.COLOR.PRIMARY)
           .text(
             "Professional Experience",
             margin.LEFT,
             GRID_CONFIG.SECTION.EXPERIENCE.START
           );

        // Divider line
        doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
           .lineWidth(0.5)
           .moveTo(margin.LEFT, GRID_CONFIG.SECTION.EXPERIENCE.START + 18)
           .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.EXPERIENCE.START + 18)
           .stroke();

        // Fixed height allocation per entry
        const entryHeight = 90;
        const maxEntries = Math.floor((GRID_CONFIG.SECTION.EXPERIENCE.HEIGHT - 25) / entryHeight);
        
        // Process only a limited number of experiences to fit fixed grid
        const experiences = data.experience?.slice(0, maxEntries) || [];
        
        experiences.forEach((exp, index) => {
          const entryY = GRID_CONFIG.SECTION.EXPERIENCE.START + 25 + (index * entryHeight);
          
          // Job title
          doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
             .fontSize(GRID_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(GRID_CONFIG.COLOR.PRIMARY)
             .text(
               truncateText(exp.jobTitle, 40),
               margin.LEFT,
               entryY
             );
             
          // Date range on the right
          const startDate = formatDate(exp.startDate);
          const endDate = exp.isCurrent ? "Present" : formatDate(exp.endDate);
          const dateText = `${startDate} - ${endDate}`;
          
          doc.font(GRID_CONFIG.FONT.PRIMARY)
             .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(GRID_CONFIG.COLOR.LIGHT_TEXT)
             .text(
               dateText,
               GRID_CONFIG.PAGE.WIDTH - margin.RIGHT - doc.widthOfString(dateText),
               entryY
             );
          
          // Company name
          doc.font(GRID_CONFIG.FONT.PRIMARY)
             .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(GRID_CONFIG.COLOR.TEXT)
             .text(
               truncateText(exp.companyName, 50),
               margin.LEFT,
               entryY + 15
             );
          
          // Responsibilities - extract bullet points
          const bulletPoints = extractBulletPoints(exp.responsibilities || "");
          
          // Show at most 3 bullet points per job
          const maxBullets = 3;
          const displayPoints = bulletPoints.slice(0, maxBullets);
          
          displayPoints.forEach((point, bIndex) => {
            const bulletY = entryY + 35 + (bIndex * 15);
            
            // Draw bullet
            doc.font(GRID_CONFIG.FONT.PRIMARY)
               .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
               .fillColor(GRID_CONFIG.COLOR.SECONDARY)
               .text("•", margin.LEFT, bulletY);
               
            // Bullet text
            doc.font(GRID_CONFIG.FONT.PRIMARY)
               .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
               .fillColor(GRID_CONFIG.COLOR.TEXT)
               .text(
                 truncateText(point, 70),
                 margin.LEFT + 15,
                 bulletY,
                 { width: contentWidth - 15 }
               );
          });
          
          // Show "..." if there are more bullet points
          if (bulletPoints.length > maxBullets) {
            doc.font(GRID_CONFIG.FONT.PRIMARY)
               .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
               .fillColor(GRID_CONFIG.COLOR.LIGHT_TEXT)
               .text(
                 "...",
                 margin.LEFT + 15,
                 entryY + 35 + (maxBullets * 15)
               );
          }
        });
      }

      // EDUCATION SECTION
      // ================
      if (includeEducation) {
        // Section title
        doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
           .fontSize(GRID_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(GRID_CONFIG.COLOR.PRIMARY)
           .text(
             "Education",
             margin.LEFT,
             GRID_CONFIG.SECTION.EDUCATION.START
           );

        // Divider line
        doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
           .lineWidth(0.5)
           .moveTo(margin.LEFT, GRID_CONFIG.SECTION.EDUCATION.START + 18)
           .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.EDUCATION.START + 18)
           .stroke();
        
        // Fixed height per education entry
        const eduEntryHeight = 50;
        const maxEduEntries = Math.floor((GRID_CONFIG.SECTION.EDUCATION.HEIGHT - 25) / eduEntryHeight);
        
        // Process limited number of education entries
        const educations = data.education?.slice(0, maxEduEntries) || [];
        
        educations.forEach((edu, index) => {
          const entryY = GRID_CONFIG.SECTION.EDUCATION.START + 25 + (index * eduEntryHeight);
          
          // Degree/major
          doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
             .fontSize(GRID_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(GRID_CONFIG.COLOR.PRIMARY)
             .text(
               truncateText(edu.major, 50),
               margin.LEFT,
               entryY
             );
          
          // Graduation date on right
          const graduationDate = formatDate(edu.endDate);
          
          doc.font(GRID_CONFIG.FONT.PRIMARY)
             .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(GRID_CONFIG.COLOR.LIGHT_TEXT)
             .text(
               graduationDate,
               GRID_CONFIG.PAGE.WIDTH - margin.RIGHT - doc.widthOfString(graduationDate),
               entryY
             );
          
          // School name
          doc.font(GRID_CONFIG.FONT.PRIMARY)
             .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(GRID_CONFIG.COLOR.TEXT)
             .text(
               truncateText(edu.schoolName, 60),
               margin.LEFT,
               entryY + 15
             );
          
          // Achievement summary (if any)
          if (edu.achievements) {
            doc.font(GRID_CONFIG.FONT.PRIMARY)
               .fontSize(GRID_CONFIG.FONT_SIZE.SMALL)
               .fillColor(GRID_CONFIG.COLOR.TEXT)
               .text(
                 truncateText(edu.achievements.replace(/[•-]\\s*/g, ''), 80),
                 margin.LEFT,
                 entryY + 30,
                 { width: contentWidth }
               );
          }
        });
      }

      // CERTIFICATES SECTION
      // ===================
      if (includeCertificates) {
        // Section title
        doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
           .fontSize(GRID_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(GRID_CONFIG.COLOR.PRIMARY)
           .text(
             "Certifications",
             margin.LEFT,
             GRID_CONFIG.SECTION.CERTIFICATES.START
           );

        // Divider line
        doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
           .lineWidth(0.5)
           .moveTo(margin.LEFT, GRID_CONFIG.SECTION.CERTIFICATES.START + 18)
           .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.CERTIFICATES.START + 18)
           .stroke();
        
        // Fixed height per certificate entry
        const certEntryHeight = 40;
        const maxCertEntries = Math.floor((GRID_CONFIG.SECTION.CERTIFICATES.HEIGHT - 25) / certEntryHeight);
        
        // Process limited number of certificates
        const certificates = data.certificates?.slice(0, maxCertEntries) || [];
        
        certificates.forEach((cert, index) => {
          const entryY = GRID_CONFIG.SECTION.CERTIFICATES.START + 25 + (index * certEntryHeight);
          
          // Certificate name
          doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
             .fontSize(GRID_CONFIG.FONT_SIZE.ENTRY_TITLE)
             .fillColor(GRID_CONFIG.COLOR.PRIMARY)
             .text(
               truncateText(cert.name, 60),
               margin.LEFT,
               entryY
             );
          
          // Date acquired on right
          const acquiredDate = formatDate(cert.dateAcquired);
          
          doc.font(GRID_CONFIG.FONT.PRIMARY)
             .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(GRID_CONFIG.COLOR.LIGHT_TEXT)
             .text(
               acquiredDate,
               GRID_CONFIG.PAGE.WIDTH - margin.RIGHT - doc.widthOfString(acquiredDate),
               entryY
             );
          
          // Institution
          doc.font(GRID_CONFIG.FONT.PRIMARY)
             .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
             .fillColor(GRID_CONFIG.COLOR.TEXT)
             .text(
               truncateText(cert.institution, 60),
               margin.LEFT,
               entryY + 15
             );
        });
      }

      // ADDITIONAL INFO SECTION (Languages, Skills)
      // ==========================================
      if (includeAdditional) {
        // Section title
        doc.font(GRID_CONFIG.FONT.PRIMARY_BOLD)
           .fontSize(GRID_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(GRID_CONFIG.COLOR.PRIMARY)
           .text(
             "Additional Information",
             margin.LEFT,
             GRID_CONFIG.SECTION.ADDITIONAL.START
           );

        // Divider line
        doc.strokeColor(GRID_CONFIG.COLOR.SECONDARY)
           .lineWidth(0.5)
           .moveTo(margin.LEFT, GRID_CONFIG.SECTION.ADDITIONAL.START + 18)
           .lineTo(GRID_CONFIG.PAGE.WIDTH - margin.RIGHT, GRID_CONFIG.SECTION.ADDITIONAL.START + 18)
           .stroke();
        
        // Languages and additional skills
        let additionalText = '';
        
        // Languages
        if (data.languages?.length) {
          const langTexts = data.languages.map(lang => 
            `${lang.name} (${lang.proficiency})`
          );
          additionalText += `Languages: ${langTexts.join(', ')}`;
        }
        
        // Additional skills
        if (data.additional?.skills?.length) {
          if (additionalText) additionalText += ' | ';
          additionalText += `Skills: ${data.additional.skills.join(', ')}`;
        }
        
        doc.font(GRID_CONFIG.FONT.PRIMARY)
           .fontSize(GRID_CONFIG.FONT_SIZE.NORMAL)
           .fillColor(GRID_CONFIG.COLOR.TEXT)
           .text(
             truncateText(additionalText, 120),
             margin.LEFT,
             GRID_CONFIG.SECTION.ADDITIONAL.START + 25,
             { width: contentWidth }
           );
      }

      // Finalize PDF
      doc.end();
    } catch (error) {
      console.error("Error generating fixed-grid CV:", error);
      reject(error);
    }
  });
}