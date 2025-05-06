import PDFDocument from "pdfkit";
import { CompleteCV } from "@shared/types";
import { Buffer } from "buffer";
import fs from "fs";

/**
 * A robust CV generator using PDFKit for precise control over layout and spacing
 * This aims to produce a compact, professional CV with consistent spacing throughout
 */

// PDF configuration
const PDF_CONFIG = {
  // Page settings (in points - 72 points = 1 inch)
  PAGE: {
    MARGIN: {
      TOP: 30,
      BOTTOM: 30,
      LEFT: 40,
      RIGHT: 40
    },
    SIZE: "A4" as const
  },
  // Fonts and sizes
  FONT: {
    DEFAULT: "Helvetica",
    DEFAULT_BOLD: "Helvetica-Bold",
    DEFAULT_ITALIC: "Helvetica-Oblique",
    DEFAULT_BOLD_ITALIC: "Helvetica-BoldOblique"
  },
  FONT_SIZE: {
    NAME: 18,
    SECTION_TITLE: 12,
    ENTRY_TITLE: 10,
    NORMAL: 10,
    SMALL: 9
  },
  // Spacing
  SPACING: {
    AFTER_NAME: 3,
    AFTER_CONTACT: 8,
    AFTER_SECTION_TITLE: 5,
    PARAGRAPH: 5,
    BETWEEN_ENTRIES: 8,
    BETWEEN_SECTIONS: 15,
    LIST_ITEM: 2
  },
  // Colors
  COLOR: {
    TEXT: "#333333",
    HEADING: "#333333",
    LINE: "#333333"
  },
  // Image settings
  IMAGE: {
    WIDTH: 80,  // Smaller width to maintain aspect ratio
    HEIGHT: 100,
    POSITION: {
      X: 480, // Right side of page
      Y: 30   // Top of page
    }
  }
};

/**
 * Create a Buffer with the PDF document
 */
export async function generateCVWithPDFKit(data: CompleteCV): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a document
      const doc = new PDFDocument({
        size: PDF_CONFIG.PAGE.SIZE,
        margin: 0, // We'll handle margins manually for more control
        bufferPages: true
      });

      // Create a buffer to store PDF data
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      // Get page dimensions
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = PDF_CONFIG.PAGE.MARGIN;
      const contentWidth = pageWidth - margin.LEFT - margin.RIGHT;
      
      // Current Y position tracker
      let y = margin.TOP;
      
      // Define sections to include and their order
      const sections = [
        { id: "header", visible: true },
        { id: "profile", visible: !!data.professional?.summary },
        { id: "competencies", visible: !!(data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) },
        { id: "experience", visible: !!data.experience?.length },
        { id: "education", visible: !!data.education?.length },
        { id: "certificates", visible: !!data.certificates?.length },
        { id: "extracurricular", visible: !!data.extracurricular?.length },
        { id: "additional", visible: !!(data.languages?.length || data.additional?.skills?.length) }
      ].filter(section => section.visible);

      // Utility functions
      const addSectionTitle = (title: string, y: number): number => {
        doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
           .fontSize(PDF_CONFIG.FONT_SIZE.SECTION_TITLE)
           .fillColor(PDF_CONFIG.COLOR.HEADING)
           .text(title, margin.LEFT, y, { lineBreak: false });
        
        y += PDF_CONFIG.FONT_SIZE.SECTION_TITLE + 2;
        
        // Add separator line
        doc.strokeColor(PDF_CONFIG.COLOR.LINE)
           .lineWidth(1)
           .moveTo(margin.LEFT, y)
           .lineTo(pageWidth - margin.RIGHT, y)
           .stroke();
           
        return y + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE;
      };
      
      const getTextHeight = (text: string, width: number, fontSize: number): number => {
        const lineHeight = fontSize * 1.3; // Approximate line height
        doc.fontSize(fontSize);
        const lines = doc.widthOfString(text) / width;
        return Math.ceil(lines) * lineHeight;
      };
      
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
      
      const checkPageBreak = (requiredHeight: number) => {
        if (y + requiredHeight > pageHeight - margin.BOTTOM) {
          doc.addPage();
          y = margin.TOP;
        }
      };

      // Process each section
      for (const section of sections) {
        switch (section.id) {
          case "header":
            // Handle photo if included
            if (data.templateSettings?.includePhoto && data.personal.photoUrl) {
              try {
                // Extract base64 data
                const photoUrl = data.personal.photoUrl;
                if (photoUrl.startsWith('data:image/')) {
                  // Get the base64 data part
                  const base64Data = photoUrl.split(',')[1];
                  if (base64Data) {
                    // Convert to buffer
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    
                    // Add image to document at right side
                    doc.image(
                      imageBuffer, 
                      PDF_CONFIG.IMAGE.POSITION.X, 
                      PDF_CONFIG.IMAGE.POSITION.Y, 
                      { 
                        fit: [PDF_CONFIG.IMAGE.WIDTH, PDF_CONFIG.IMAGE.HEIGHT],
                        align: 'right'
                      }
                    );
                    // No need to adjust y position as the image is positioned absolutely
                  }
                }
              } catch (err) {
                console.error("Error adding photo to PDF:", err);
                // Continue without image if there's an error
              }
            }
            
            // Name
            doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
               .fontSize(PDF_CONFIG.FONT_SIZE.NAME)
               .fillColor(PDF_CONFIG.COLOR.HEADING)
               .text(`${data.personal.firstName} ${data.personal.lastName}`, margin.LEFT, y, { lineBreak: false });
               
            y += PDF_CONFIG.FONT_SIZE.NAME + PDF_CONFIG.SPACING.AFTER_NAME;
            
            // Add separator line
            doc.strokeColor(PDF_CONFIG.COLOR.LINE)
               .lineWidth(1)
               .moveTo(margin.LEFT, y)
               .lineTo(pageWidth - margin.RIGHT, y)
               .stroke();
               
            y += 5; // Space after line
            
            // Contact info
            doc.font(PDF_CONFIG.FONT.DEFAULT)
               .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
               .fillColor(PDF_CONFIG.COLOR.TEXT);
               
            // Format contact info on one line with separators
            const contactParts = [];
            
            if (data.personal.email) {
              contactParts.push(data.personal.email);
            }
            
            if (data.personal.phone) {
              contactParts.push(data.personal.phone);
            }
            
            if (data.personal.linkedin) {
              contactParts.push(data.personal.linkedin);
            }
            
            const contactText = contactParts.join(" | ");
            doc.text(contactText, margin.LEFT, y, { lineBreak: false });
            
            y += PDF_CONFIG.FONT_SIZE.NORMAL + PDF_CONFIG.SPACING.AFTER_CONTACT;
            break;
            
          case "profile":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 40);
            
            // Add section title
            y = addSectionTitle("Summary", y);
            
            // Add profile text
            doc.font(PDF_CONFIG.FONT.DEFAULT)
               .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
               .fillColor(PDF_CONFIG.COLOR.TEXT)
               .text(data.professional?.summary || "", margin.LEFT, y, {
                 width: contentWidth,
                 align: "left"
               });
               
            // Move position based on text height
            const summaryHeight = getTextHeight(data.professional?.summary || "", contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
            y += summaryHeight + 15; // Fixed spacing to match other sections
            break;
            
          case "competencies":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 60);
            
            // Add section title
            y = addSectionTitle("Key Competencies", y);
            
            // Combined skills - just display all skills together without labels
            const allSkills = [
              ...(data.keyCompetencies?.technicalSkills || []),
              ...(data.keyCompetencies?.softSkills || [])
            ];
            
            if (allSkills.length > 0) {
              doc.font(PDF_CONFIG.FONT.DEFAULT)
                 .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                 .fillColor(PDF_CONFIG.COLOR.TEXT)
                 .text(allSkills.join(", "), margin.LEFT, y, {
                   width: contentWidth,
                   align: "left"
                 });
                 
              // Move position based on text height
              const skillsText = allSkills.join(", ");
              const skillsHeight = getTextHeight(skillsText, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
              y += skillsHeight + PDF_CONFIG.SPACING.PARAGRAPH;
            }
            
            // Use consistent spacing after competencies section to match other sections
            y += 15; // Consistent spacing to match other sections
            break;
            
          case "experience":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 40);
            
            // Add section title
            y = addSectionTitle("Experience", y);
            
            // Process each experience entry
            if (data.experience?.length) {
              data.experience.forEach((exp, index) => {
                // Estimate height for this entry
                const expTitleHeight = PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                const companyHeight = PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                const respHeight = getTextHeight(exp.responsibilities || "", contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
                const totalHeight = expTitleHeight + companyHeight + respHeight + 15;
                
                // Check if we need a page break
                checkPageBreak(totalHeight);
                
                // Two-column layout with job title on left, dates on right
                doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
                   .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
                   .fillColor(PDF_CONFIG.COLOR.HEADING)
                   .text(exp.jobTitle, margin.LEFT, y, { lineBreak: false });
                   
                // Date on the right
                const startDate = formatDate(exp.startDate);
                const endDate = exp.isCurrent ? "Present" : formatDate(exp.endDate);
                const dateText = `${startDate} - ${endDate}`;
                
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(dateText, pageWidth - margin.RIGHT - doc.widthOfString(dateText), y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                
                // Company name
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(exp.companyName, margin.LEFT, y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                
                // Process responsibilities text with bullet points
                if (exp.responsibilities) {
                  const bulletIndent = 15;
                  
                  // Split by new lines and process each paragraph
                  const paragraphs = exp.responsibilities.split('\n');
                  
                  paragraphs.forEach((paragraph, pIndex) => {
                    if (!paragraph.trim()) return;
                    
                    // If line starts with bullet marker, format accordingly
                    if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                      const cleanText = paragraph.trim().substring(1).trim();
                      
                      // Draw bullet
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text('•', margin.LEFT, y, { lineBreak: false });
                         
                      // Add indented text after bullet
                      doc.text(cleanText, margin.LEFT + bulletIndent, y, {
                        width: contentWidth - bulletIndent,
                        align: 'left'
                      });
                      
                      // Calculate height of this bullet point
                      const paraHeight = getTextHeight(cleanText, contentWidth - bulletIndent, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    } else {
                      // Regular paragraph
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text(paragraph, margin.LEFT, y, {
                           width: contentWidth,
                           align: 'left'
                         });
                         
                      // Calculate height of this paragraph
                      const paraHeight = getTextHeight(paragraph, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    }
                    
                    // Add small spacing between paragraphs
                    if (pIndex < paragraphs.length - 1) {
                      y += PDF_CONFIG.SPACING.LIST_ITEM;
                    }
                  });
                }
                
                // Add space between entries (except after the last one)
                if (index < data.experience.length - 1) {
                  y += PDF_CONFIG.SPACING.BETWEEN_ENTRIES;
                }
              });
              
              y += PDF_CONFIG.SPACING.BETWEEN_SECTIONS;
            }
            break;
            
          case "education":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 40);
            
            // Add section title
            y = addSectionTitle("Education", y);
            
            // Process each education entry
            if (data.education?.length) {
              data.education.forEach((edu, index) => {
                // Estimate height for this entry
                const titleHeight = PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                const schoolHeight = PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                const achieveHeight = edu.achievements 
                  ? getTextHeight(edu.achievements, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL) 
                  : 0;
                const totalHeight = titleHeight + schoolHeight + achieveHeight + 10;
                
                // Check if we need a page break
                checkPageBreak(totalHeight);
                
                // Two column layout - degree left, dates right
                doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
                   .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
                   .fillColor(PDF_CONFIG.COLOR.HEADING)
                   .text(edu.major, margin.LEFT, y, { lineBreak: false });
                   
                // Date on the right
                const endDate = formatDate(edu.endDate);
                
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(endDate, pageWidth - margin.RIGHT - doc.widthOfString(endDate), y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                
                // School name
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(edu.schoolName, margin.LEFT, y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                
                // Achievements if any
                if (edu.achievements) {
                  // Process with bullet points if needed
                  const bulletIndent = 15;
                  
                  // Split by new lines and process each paragraph
                  const paragraphs = edu.achievements.split('\n');
                  
                  paragraphs.forEach((paragraph, pIndex) => {
                    if (!paragraph.trim()) return;
                    
                    // If line starts with bullet marker, format accordingly
                    if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                      const cleanText = paragraph.trim().substring(1).trim();
                      
                      // Draw bullet
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text('•', margin.LEFT, y, { lineBreak: false });
                         
                      // Add indented text after bullet
                      doc.text(cleanText, margin.LEFT + bulletIndent, y, {
                        width: contentWidth - bulletIndent,
                        align: 'left'
                      });
                      
                      // Calculate height of this bullet point
                      const paraHeight = getTextHeight(cleanText, contentWidth - bulletIndent, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    } else {
                      // Regular paragraph
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text(paragraph, margin.LEFT, y, {
                           width: contentWidth,
                           align: 'left'
                         });
                         
                      // Calculate height of this paragraph
                      const paraHeight = getTextHeight(paragraph, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    }
                    
                    // Add small spacing between paragraphs
                    if (pIndex < paragraphs.length - 1) {
                      y += PDF_CONFIG.SPACING.LIST_ITEM;
                    }
                  });
                }
                
                // Add space between entries (except after the last one)
                if (index < data.education.length - 1) {
                  y += PDF_CONFIG.SPACING.BETWEEN_ENTRIES;
                }
              });
              
              y += PDF_CONFIG.SPACING.BETWEEN_SECTIONS;
            }
            break;
            
          case "certificates":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 40);
            
            // Add section title
            y = addSectionTitle("Certificates", y);
            
            // Process each certificate entry
            if (data.certificates?.length) {
              data.certificates.forEach((cert, index) => {
                // Estimate height for this entry
                const titleHeight = PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                const instHeight = PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                const achieveHeight = cert.achievements 
                  ? getTextHeight(cert.achievements, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL) 
                  : 0;
                const totalHeight = titleHeight + instHeight + achieveHeight + 10;
                
                // Check if we need a page break
                checkPageBreak(totalHeight);
                
                // Certificate name and date
                doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
                   .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
                   .fillColor(PDF_CONFIG.COLOR.HEADING)
                   .text(cert.name, margin.LEFT, y, { lineBreak: false });
                   
                // Date on the right
                const acquiredDate = formatDate(cert.dateAcquired);
                
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(acquiredDate, pageWidth - margin.RIGHT - doc.widthOfString(acquiredDate), y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                
                // Institution
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(cert.institution, margin.LEFT, y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                
                // Achievements if any
                if (cert.achievements) {
                  // Process with bullet points if needed
                  const bulletIndent = 15;
                  
                  // Split by new lines and process each paragraph
                  const paragraphs = cert.achievements.split('\n');
                  
                  paragraphs.forEach((paragraph, pIndex) => {
                    if (!paragraph.trim()) return;
                    
                    // If line starts with bullet marker, format accordingly
                    if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                      const cleanText = paragraph.trim().substring(1).trim();
                      
                      // Draw bullet
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text('•', margin.LEFT, y, { lineBreak: false });
                         
                      // Add indented text after bullet
                      doc.text(cleanText, margin.LEFT + bulletIndent, y, {
                        width: contentWidth - bulletIndent,
                        align: 'left'
                      });
                      
                      // Calculate height of this bullet point
                      const paraHeight = getTextHeight(cleanText, contentWidth - bulletIndent, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    } else {
                      // Regular paragraph
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text(paragraph, margin.LEFT, y, {
                           width: contentWidth,
                           align: 'left'
                         });
                         
                      // Calculate height of this paragraph
                      const paraHeight = getTextHeight(paragraph, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    }
                    
                    // Add small spacing between paragraphs
                    if (pIndex < paragraphs.length - 1) {
                      y += PDF_CONFIG.SPACING.LIST_ITEM;
                    }
                  });
                }
                
                // Add space between entries (except after the last one)
                if (index < data.certificates.length - 1) {
                  y += PDF_CONFIG.SPACING.BETWEEN_ENTRIES;
                }
              });
              
              y += PDF_CONFIG.SPACING.BETWEEN_SECTIONS;
            }
            break;
            
          case "extracurricular":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 40);
            
            // Add section title
            y = addSectionTitle("Extracurricular Activities", y);
            
            // Process each extracurricular entry
            if (data.extracurricular?.length) {
              data.extracurricular.forEach((activity, index) => {
                // Estimate height for this entry
                const titleHeight = PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                const orgHeight = PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                const descHeight = getTextHeight(activity.description || "", contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
                const totalHeight = titleHeight + orgHeight + descHeight + 10;
                
                // Check if we need a page break
                checkPageBreak(totalHeight);
                
                // Role and date
                doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
                   .fontSize(PDF_CONFIG.FONT_SIZE.ENTRY_TITLE)
                   .fillColor(PDF_CONFIG.COLOR.HEADING)
                   .text(activity.role, margin.LEFT, y, { lineBreak: false });
                   
                // Date on the right
                const startDate = formatDate(activity.startDate);
                const endDate = activity.isCurrent ? "Present" : formatDate(activity.endDate);
                const dateText = `${startDate} - ${endDate}`;
                
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(dateText, pageWidth - margin.RIGHT - doc.widthOfString(dateText), y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.ENTRY_TITLE * 1.3;
                
                // Organization
                doc.font(PDF_CONFIG.FONT.DEFAULT)
                   .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                   .fillColor(PDF_CONFIG.COLOR.TEXT)
                   .text(activity.organization, margin.LEFT, y, { lineBreak: false });
                   
                y += PDF_CONFIG.FONT_SIZE.NORMAL * 1.3;
                
                // Description with bullet points
                if (activity.description) {
                  // Process with bullet points if needed
                  const bulletIndent = 15;
                  
                  // Split by new lines and process each paragraph
                  const paragraphs = activity.description.split('\n');
                  
                  paragraphs.forEach((paragraph, pIndex) => {
                    if (!paragraph.trim()) return;
                    
                    // If line starts with bullet marker, format accordingly
                    if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
                      const cleanText = paragraph.trim().substring(1).trim();
                      
                      // Draw bullet
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text('•', margin.LEFT, y, { lineBreak: false });
                         
                      // Add indented text after bullet
                      doc.text(cleanText, margin.LEFT + bulletIndent, y, {
                        width: contentWidth - bulletIndent,
                        align: 'left'
                      });
                      
                      // Calculate height of this bullet point
                      const paraHeight = getTextHeight(cleanText, contentWidth - bulletIndent, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    } else {
                      // Regular paragraph
                      doc.font(PDF_CONFIG.FONT.DEFAULT)
                         .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                         .fillColor(PDF_CONFIG.COLOR.TEXT)
                         .text(paragraph, margin.LEFT, y, {
                           width: contentWidth,
                           align: 'left'
                         });
                         
                      // Calculate height of this paragraph
                      const paraHeight = getTextHeight(paragraph, contentWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
                      y += paraHeight;
                    }
                    
                    // Add small spacing between paragraphs
                    if (pIndex < paragraphs.length - 1) {
                      y += PDF_CONFIG.SPACING.LIST_ITEM;
                    }
                  });
                }
                
                // Add space between entries (except after the last one)
                if (index < data.extracurricular.length - 1) {
                  y += PDF_CONFIG.SPACING.BETWEEN_ENTRIES;
                }
              });
              
              y += PDF_CONFIG.SPACING.BETWEEN_SECTIONS;
            }
            break;
            
          case "additional":
            // Check if we need a page break
            checkPageBreak(PDF_CONFIG.FONT_SIZE.SECTION_TITLE + PDF_CONFIG.SPACING.AFTER_SECTION_TITLE + 40);
            
            // Add section title
            y = addSectionTitle("Additional Information", y);
            
            // Computer skills
            if (data.additional?.skills?.length) {
              // Check if we need a page break
              checkPageBreak(PDF_CONFIG.FONT_SIZE.NORMAL * 2);
              
              doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
                 .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                 .fillColor(PDF_CONFIG.COLOR.HEADING)
                 .text("IT skills:", margin.LEFT, y, { continued: true });
                 
              const labelWidth = doc.widthOfString("IT skills: ");
              
              doc.font(PDF_CONFIG.FONT.DEFAULT)
                 .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                 .fillColor(PDF_CONFIG.COLOR.TEXT);
                 
              // Add skills, continued from the label
              const skillsText = data.additional.skills.join(", ");
              doc.text(skillsText, {
                continued: false,
                width: contentWidth - labelWidth,
                align: "left"
              });
              
              const skillsHeight = getTextHeight(skillsText, contentWidth - labelWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
              y += skillsHeight + PDF_CONFIG.SPACING.PARAGRAPH;
            }
            
            // Languages
            if (data.languages?.length) {
              // Check if we need a page break
              checkPageBreak(PDF_CONFIG.FONT_SIZE.NORMAL * 2);
              
              doc.font(PDF_CONFIG.FONT.DEFAULT_BOLD)
                 .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                 .fillColor(PDF_CONFIG.COLOR.HEADING)
                 .text("Languages:", margin.LEFT, y, { continued: true });
                 
              const labelWidth = doc.widthOfString("Languages: ");
              
              doc.font(PDF_CONFIG.FONT.DEFAULT)
                 .fontSize(PDF_CONFIG.FONT_SIZE.NORMAL)
                 .fillColor(PDF_CONFIG.COLOR.TEXT);
                 
              // Add languages, continued from the label
              const languagesText = data.languages.map(lang => 
                `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
              ).join(", ");
              
              doc.text(languagesText, {
                continued: false,
                width: contentWidth - labelWidth,
                align: "left"
              });
              
              const langsHeight = getTextHeight(languagesText, contentWidth - labelWidth, PDF_CONFIG.FONT_SIZE.NORMAL);
              y += langsHeight + PDF_CONFIG.SPACING.PARAGRAPH;
            }
            
            y += PDF_CONFIG.SPACING.BETWEEN_SECTIONS - PDF_CONFIG.SPACING.PARAGRAPH;
            break;
        }
      }

      // Finalize document
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      reject(error);
    }
  });
}