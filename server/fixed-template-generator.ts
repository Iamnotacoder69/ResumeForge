import PDFDocument from "pdfkit";
import { CompleteCv as CompleteCV } from "@shared/schema";
import { Buffer } from "buffer";
import { TEMPLATE_CONFIG, getSectionSpacing, getContentWidth, calculateTextHeight } from "./template-config";

/**
 * Fixed Template CV Generator
 * 
 * This generator uses fixed spacing values to ensure consistent layout
 * throughout the CV document. No dynamic calculations or adjustments
 * are made during the PDF generation process.
 */

/**
 * Generate a CV with consistent fixed spacing
 * @param data CV data
 * @returns PDF as buffer
 */
export async function generateFixedCV(data: CompleteCV): Promise<Buffer> {
  console.log("PDF Generation - Using fixed template generator");
  
  // Initialize PDF document
  const doc = new PDFDocument({
    size: "A4",
    margin: 0, // We'll handle margins manually for more control
    info: {
      Title: `${data.personal?.firstName || ""} ${data.personal?.lastName || ""} - Curriculum Vitae`,
      Author: `${data.personal?.firstName || ""} ${data.personal?.lastName || ""}`,
      Subject: "Curriculum Vitae",
      Keywords: "cv, resume, curriculum vitae",
    }
  });
  
  // Create a buffer to store the PDF
  const buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));
  
  // Extract page dimensions and margins
  const pageWidth = TEMPLATE_CONFIG.PAGE.WIDTH;
  const pageHeight = TEMPLATE_CONFIG.PAGE.HEIGHT;
  const margin = TEMPLATE_CONFIG.PAGE.MARGIN;
  const contentWidth = getContentWidth();
  
  // Initialize position tracking
  let y = margin.TOP;
  
  // Helper function to add a section title with consistent spacing
  function addSectionTitle(title: string, yPosition: number): number {
    // Add section title
    doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY_BOLD)
       .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.SECTION_TITLE)
       .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.PRIMARY)
       .text(title, margin.LEFT, yPosition, { lineBreak: false });
    
    // Add separator line
    const titleWidth = doc.widthOfString(title);
    const lineStart = margin.LEFT;
    const lineY = yPosition + TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.SECTION_TITLE + 1;
    
    doc.moveTo(lineStart, lineY)
       .lineTo(pageWidth - margin.RIGHT, lineY)
       .lineWidth(TEMPLATE_CONFIG.LAYOUT.SECTION_SEPARATOR.WIDTH)
       .strokeColor(TEMPLATE_CONFIG.LAYOUT.SECTION_SEPARATOR.COLOR)
       .stroke();
    
    // Return the new Y position after the section title and separator
    return yPosition + TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.SECTION_TITLE + 
           TEMPLATE_CONFIG.SPACING.AFTER_SECTION_TITLE;
  }
  
  // Check if we need a page break
  function checkPageBreak(heightNeeded: number): void {
    if (y + heightNeeded > pageHeight - margin.BOTTOM) {
      doc.addPage();
      y = margin.TOP;
    }
  }
  
  // Format dates consistently
  function formatDate(dateStr?: string, isCurrent: boolean = false): string {
    if (isCurrent) return "Present";
    if (!dateStr) return "";
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  // Add personal information section
  function addPersonalInfo(): void {
    // Add name with larger font
    doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY_BOLD)
       .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NAME)
       .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.PRIMARY)
       .text(`${data.personal?.firstName || ""} ${data.personal?.lastName || ""}`, 
             margin.LEFT, y, { lineBreak: false });
             
    y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NAME + TEMPLATE_CONFIG.SPACING.AFTER_NAME;
    
    // Add contact information on one line
    let contactInfo = [];
    if (data.personal?.email) contactInfo.push(data.personal.email);
    if (data.personal?.phone) contactInfo.push(data.personal.phone);
    if (data.personal?.linkedin) contactInfo.push(`linkedin.com/in/${data.personal.linkedin}`);
    
    doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
       .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
       .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
       .text(contactInfo.join(' | '), margin.LEFT, y, { lineBreak: false });
       
    y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
         TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL + 
         TEMPLATE_CONFIG.SPACING.AFTER_CONTACT;
    
    // Add separator line
    doc.moveTo(margin.LEFT, y)
       .lineTo(pageWidth - margin.RIGHT, y)
       .lineWidth(TEMPLATE_CONFIG.LAYOUT.SECTION_SEPARATOR.WIDTH)
       .strokeColor(TEMPLATE_CONFIG.LAYOUT.SECTION_SEPARATOR.COLOR)
       .stroke();
       
    y += 5; // Space after separator line
  }
  
  // Add summary section with fixed spacing
  function addSummary(): void {
    y = addSectionTitle("Summary", y);
    
    if (data.professional?.summary) {
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
         .text(data.professional.summary, margin.LEFT, y, {
           width: contentWidth,
           align: "left"
         });
      
      // Move position based on text height with fixed spacing
      const summaryHeight = calculateTextHeight(
        data.professional.summary, 
        contentWidth, 
        TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL
      );
      
      // Just add content height plus paragraph spacing, NOT section spacing
      y += summaryHeight + TEMPLATE_CONFIG.SPACING.AFTER_PARAGRAPH;
    }
    
    // Use EXACTLY the same fixed spacing between all sections
    y += getSectionSpacing();
  }
  
  // Add key competencies with fixed spacing
  function addKeyCompetencies(): void {
    y = addSectionTitle("Key Competencies", y);
    
    // Combine technical and soft skills
    const allSkills = [
      ...(data.keyCompetencies?.technicalSkills || []),
      ...(data.keyCompetencies?.softSkills || [])
    ];
    
    if (allSkills.length > 0) {
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
         .text(allSkills.join(", "), margin.LEFT, y, {
           width: contentWidth,
           align: "left"
         });
      
      // Move position based on text height
      const skillsText = allSkills.join(", ");
      const skillsHeight = calculateTextHeight(
        skillsText, 
        contentWidth, 
        TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL
      );
      
      // Just add content height plus paragraph spacing, NOT section spacing
      y += skillsHeight + TEMPLATE_CONFIG.SPACING.AFTER_PARAGRAPH;
    }
    
    // Use EXACTLY the same fixed spacing between all sections
    y += getSectionSpacing();
  }
  
  // Add experience section with bullet points
  function addExperience(): void {
    y = addSectionTitle("Experience", y);
    
    if (data.experience?.length) {
      data.experience.forEach((exp, index) => {
        // Two-column layout with job title on left, dates on right
        doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY_BOLD)
           .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE)
           .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.PRIMARY)
           .text(exp.jobTitle, margin.LEFT, y, { lineBreak: false });
        
        // Date on the right
        const startDate = formatDate(exp.startDate);
        const endDate = exp.isCurrent ? "Present" : formatDate(exp.endDate);
        const dateText = `${startDate} - ${endDate}`;
        
        doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
           .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
           .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
           .text(dateText, 
                 pageWidth - margin.RIGHT - doc.widthOfString(dateText), 
                 y, 
                 { lineBreak: false });
        
        y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE * 
             TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
        
        // Company name
        doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
           .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
           .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
           .text(exp.companyName, margin.LEFT, y, { lineBreak: false });
        
        y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
             TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
        
        // Process responsibilities with bullet points
        if (exp.responsibilities) {
          // Split by new lines and process each paragraph
          const paragraphs = exp.responsibilities.split('\n');
          
          paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) return;
            
            // If line starts with bullet marker, format accordingly
            if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
              const cleanText = paragraph.trim().substring(1).trim();
              
              // Draw bullet
              doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
                 .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
                 .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
                 .text(TEMPLATE_CONFIG.LAYOUT.BULLET_POINT, margin.LEFT, y, { lineBreak: false });
              
              // Add indented text after bullet
              doc.text(cleanText, 
                       margin.LEFT + TEMPLATE_CONFIG.SPACING.BULLET_INDENT, 
                       y, 
                       {
                         width: contentWidth - TEMPLATE_CONFIG.SPACING.BULLET_INDENT,
                         align: 'left'
                       });
              
              // Calculate height of this bullet point with fixed line height
              const lineCount = Math.ceil(
                doc.widthOfString(cleanText) / 
                (contentWidth - TEMPLATE_CONFIG.SPACING.BULLET_INDENT)
              );
              
              y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
                   TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
                   lineCount;
            } else {
              // Regular paragraph
              doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
                 .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
                 .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
                 .text(paragraph, margin.LEFT, y, {
                   width: contentWidth,
                   align: 'left'
                 });
              
              // Calculate height with fixed line height
              const lineCount = Math.ceil(
                doc.widthOfString(paragraph) / contentWidth
              );
              
              y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
                   TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
                   lineCount;
            }
            
            // Add small spacing between paragraphs
            if (pIndex < paragraphs.length - 1) {
              y += TEMPLATE_CONFIG.SPACING.LIST_ITEM_SPACING;
            }
          });
        }
        
        // Add space between entries (except after the last one)
        if (index < data.experience.length - 1) {
          y += TEMPLATE_CONFIG.SPACING.BETWEEN_ENTRIES;
        }
      });
      
      // Use EXACTLY the same fixed spacing between all sections
      y += getSectionSpacing();
    }
  }
  
  // Add education section
  function addEducation(): void {
    y = addSectionTitle("Education", y);
    
    if (data.education?.length) {
      data.education.forEach((edu, index) => {
        // Two column layout - degree left, dates right
        doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY_BOLD)
           .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE)
           .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.PRIMARY)
           .text(edu.major, margin.LEFT, y, { lineBreak: false });
        
        // Date on the right
        const endDate = formatDate(edu.endDate);
        
        doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
           .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
           .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
           .text(endDate, 
                 pageWidth - margin.RIGHT - doc.widthOfString(endDate), 
                 y, 
                 { lineBreak: false });
        
        y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE * 
             TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
        
        // School name
        doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
           .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
           .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
           .text(edu.schoolName, margin.LEFT, y, { lineBreak: false });
        
        y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
             TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
        
        // Process achievements with bullet points if present
        if (edu.achievements) {
          // Split by new lines and process each paragraph
          const paragraphs = edu.achievements.split('\n');
          
          paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) return;
            
            // If line starts with bullet marker, format accordingly
            if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
              const cleanText = paragraph.trim().substring(1).trim();
              
              // Draw bullet
              doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
                 .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
                 .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
                 .text(TEMPLATE_CONFIG.LAYOUT.BULLET_POINT, margin.LEFT, y, { lineBreak: false });
              
              // Add indented text after bullet
              doc.text(cleanText, 
                       margin.LEFT + TEMPLATE_CONFIG.SPACING.BULLET_INDENT, 
                       y, 
                       {
                         width: contentWidth - TEMPLATE_CONFIG.SPACING.BULLET_INDENT,
                         align: 'left'
                       });
              
              // Fixed height calculation
              const lineCount = Math.ceil(
                doc.widthOfString(cleanText) / 
                (contentWidth - TEMPLATE_CONFIG.SPACING.BULLET_INDENT)
              );
              
              y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
                   TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
                   lineCount;
            } else {
              // Regular paragraph
              doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
                 .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
                 .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
                 .text(paragraph, margin.LEFT, y, {
                   width: contentWidth,
                   align: 'left'
                 });
              
              // Fixed height calculation
              const lineCount = Math.ceil(
                doc.widthOfString(paragraph) / contentWidth
              );
              
              y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
                   TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
                   lineCount;
            }
            
            // Add small spacing between paragraphs
            if (pIndex < paragraphs.length - 1) {
              y += TEMPLATE_CONFIG.SPACING.LIST_ITEM_SPACING;
            }
          });
        }
        
        // Add space between entries (except after the last one)
        if (index < data.education.length - 1) {
          y += TEMPLATE_CONFIG.SPACING.BETWEEN_ENTRIES;
        }
      });
      
      // Use EXACTLY the same fixed spacing between all sections
      y += getSectionSpacing();
    }
  }
  
  // Add certificates section
  function addCertificates(): void {
    if (!data.certificates?.length) return;
    
    y = addSectionTitle("Certificates", y);
    
    data.certificates.forEach((cert, index) => {
      // Certificate name and date
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY_BOLD)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.PRIMARY)
         .text(cert.name, margin.LEFT, y, { lineBreak: false });
      
      // Date on the right
      const acquiredDate = formatDate(cert.dateAcquired);
      
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
         .text(acquiredDate, 
               pageWidth - margin.RIGHT - doc.widthOfString(acquiredDate), 
               y, 
               { lineBreak: false });
      
      y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE * 
           TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
      
      // Institution name
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
         .text(cert.institution, margin.LEFT, y, { lineBreak: false });
      
      y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
           TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
      
      // Add space between entries (except after the last one)
      if (index < data.certificates.length - 1) {
        y += TEMPLATE_CONFIG.SPACING.BETWEEN_ENTRIES;
      }
    });
    
    // Add fixed section spacing
    y += getSectionSpacing();
  }
  
  // Add extracurricular activities section
  function addExtracurricular(): void {
    if (!data.extracurricular?.length) return;
    
    y = addSectionTitle("Extracurricular Activities", y);
    
    data.extracurricular.forEach((extra, index) => {
      // Role and date
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY_BOLD)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.PRIMARY)
         .text(extra.role, margin.LEFT, y, { lineBreak: false });
      
      // Date on the right
      const startDate = formatDate(extra.startDate);
      const endDate = extra.isCurrent ? "Present" : formatDate(extra.endDate);
      const dateText = `${startDate} - ${endDate}`;
      
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
         .text(dateText, 
               pageWidth - margin.RIGHT - doc.widthOfString(dateText), 
               y, 
               { lineBreak: false });
      
      y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.ENTRY_TITLE * 
           TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
      
      // Organization name
      doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
         .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
         .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
         .text(extra.organization, margin.LEFT, y, { lineBreak: false });
      
      y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
           TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL;
      
      // Process description with bullet points
      if (extra.description) {
        // Split by new lines and process each paragraph
        const paragraphs = extra.description.split('\n');
        
        paragraphs.forEach((paragraph, pIndex) => {
          if (!paragraph.trim()) return;
          
          // If line starts with bullet marker, format accordingly
          if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
            const cleanText = paragraph.trim().substring(1).trim();
            
            // Draw bullet
            doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
               .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
               .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
               .text(TEMPLATE_CONFIG.LAYOUT.BULLET_POINT, margin.LEFT, y, { lineBreak: false });
            
            // Add indented text after bullet
            doc.text(cleanText, 
                     margin.LEFT + TEMPLATE_CONFIG.SPACING.BULLET_INDENT, 
                     y, 
                     {
                       width: contentWidth - TEMPLATE_CONFIG.SPACING.BULLET_INDENT,
                       align: 'left'
                     });
            
            // Fixed height calculation
            const lineCount = Math.ceil(
              doc.widthOfString(cleanText) / 
              (contentWidth - TEMPLATE_CONFIG.SPACING.BULLET_INDENT)
            );
            
            y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
                 TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
                 lineCount;
          } else {
            // Regular paragraph
            doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
               .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
               .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
               .text(paragraph, margin.LEFT, y, {
                 width: contentWidth,
                 align: 'left'
               });
            
            // Fixed height calculation
            const lineCount = Math.ceil(
              doc.widthOfString(paragraph) / contentWidth
            );
            
            y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
                 TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
                 lineCount;
          }
          
          // Add small spacing between paragraphs
          if (pIndex < paragraphs.length - 1) {
            y += TEMPLATE_CONFIG.SPACING.LIST_ITEM_SPACING;
          }
        });
      }
      
      // Add space between entries (except after the last one)
      if (index < data.extracurricular.length - 1) {
        y += TEMPLATE_CONFIG.SPACING.BETWEEN_ENTRIES;
      }
    });
    
    // Add fixed section spacing
    y += getSectionSpacing();
  }
  
  // Add languages section
  function addLanguages(): void {
    if (!data.languages?.length) return;
    
    y = addSectionTitle("Languages", y);
    
    // Format languages as a list
    const languageItems = data.languages.map(lang => 
      `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
    );
    
    doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
       .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
       .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
       .text(languageItems.join(", "), margin.LEFT, y, {
         width: contentWidth,
         align: "left"
       });
    
    // Fixed height calculation
    const lineCount = Math.ceil(
      doc.widthOfString(languageItems.join(", ")) / contentWidth
    );
    
    y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
         TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
         lineCount;
    
    // Add fixed section spacing
    y += getSectionSpacing();
  }
  
  // Add additional skills section
  function addAdditionalSkills(): void {
    if (!data.additional?.skills?.length) return;
    
    y = addSectionTitle("Additional Skills", y);
    
    doc.font(TEMPLATE_CONFIG.TYPOGRAPHY.FONTS.PRIMARY)
       .fontSize(TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL)
       .fillColor(TEMPLATE_CONFIG.TYPOGRAPHY.COLORS.SECONDARY)
       .text(data.additional.skills.join(", "), margin.LEFT, y, {
         width: contentWidth,
         align: "left"
       });
    
    // Fixed height calculation
    const lineCount = Math.ceil(
      doc.widthOfString(data.additional.skills.join(", ")) / contentWidth
    );
    
    y += TEMPLATE_CONFIG.TYPOGRAPHY.SIZES.NORMAL * 
         TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL * 
         lineCount;
  }
  
  // Generate CV with sections in order specified by the template config
  try {
    // Start with personal info which is always at the top
    addPersonalInfo();
    
    // Then add other sections in the fixed order
    for (const sectionType of TEMPLATE_CONFIG.SECTION_ORDER) {
      // Skip personal since we already added it
      if (sectionType === 'personal') continue;
      
      checkPageBreak(100); // Check for page break before adding section
      
      // Add appropriate section based on type
      switch (sectionType) {
        case 'summary':
          addSummary();
          break;
          
        case 'keyCompetencies':
          addKeyCompetencies();
          break;
          
        case 'experience':
          addExperience();
          break;
          
        case 'education':
          addEducation();
          break;
          
        case 'certificates':
          addCertificates();
          break;
          
        case 'extracurricular':
          addExtracurricular();
          break;
          
        case 'additional':
          addAdditionalSkills();
          break;
      }
    }
    
    // Finalize the PDF
    doc.end();
    
    // Return as buffer
    return new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
    });
  } catch (error) {
    console.error("Error generating fixed CV:", error);
    throw error;
  }
}