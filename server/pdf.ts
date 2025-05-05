import { jsPDF } from "jspdf";
import { CompleteCV, SectionOrder, TemplateType } from "@shared/types";

// Standardized spacing constants
const SPACING = {
  SECTION: 7,          // Space after each major section
  ENTRY: 5,            // Space between entries within a section
  SECTION_TITLE: 2,    // Extra space after section titles (in addition to line height)
  LINE_BELOW_TITLE: 2, // Space after visual separators
  TEXT_BLOCK: 0,       // No additional spacing after text blocks (line height handles this)
  SUB_SECTION: 5       // Space between sub-sections
};

/**
 * Helper function for wrapped text with consistent spacing
 * @param doc PDF document
 * @param text Text to wrap
 * @param x X-coordinate
 * @param y Y-coordinate
 * @param maxWidth Maximum width for text wrapping
 * @param lineHeight Line height to use
 * @returns Updated Y position after text
 */
function addWrappedText(doc: jsPDF, text: string | undefined, x: number, y: number, maxWidth: number, lineHeight: number): number {
  if (!text || typeof text !== 'string' || text.trim() === '') return y;
  
  // Process text for bullet points
  // Split by new lines first
  const paragraphs = text.split('\n');
  let currentY = y;
  
  paragraphs.forEach((paragraph, i) => {
    if (paragraph.trim() === '') return; // Skip empty paragraphs
    
    // Format bullet points if line starts with - or •
    const hasBullet = paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•');
    let processedText = paragraph;
    
    if (hasBullet) {
      // Create proper bullet point spacing
      processedText = paragraph.trim().substring(1).trim();
      const bulletX = x;
      const textX = x + 4; // Indent text after bullet
      
      // Add bullet point
      doc.text('•', bulletX, currentY);
      
      // Process remaining text with indentation
      const bulletLines = doc.splitTextToSize(processedText, maxWidth - 4);
      doc.text(bulletLines, textX, currentY);
      currentY += (bulletLines.length * lineHeight);
    } else {
      // Regular paragraph
      const lines = doc.splitTextToSize(paragraph, maxWidth);
      doc.text(lines, x, currentY);
      currentY += (lines.length * lineHeight);
    }
  });
  
  return currentY;
}

/**
 * Adds a visual separator line under a section title
 * @param doc PDF document
 * @param x Starting X-coordinate
 * @param y Y-coordinate
 * @param width Width of the line
 * @param color RGB color array
 * @returns Updated Y position after separator
 */
function addSectionSeparator(doc: jsPDF, x: number, y: number, width: number, color: [number, number, number]): number {
  // Set thickness of separator line for better visibility
  doc.setLineWidth(0.5);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.line(x, y, x + width, y);
  // Reset to normal line width
  doc.setLineWidth(0.1);
  return y + SPACING.LINE_BELOW_TITLE;
}

// Helper function to handle photo URLs, converting base64 data URLs if needed
function prepareImageForPDF(photoUrl: string): { imageData: string, format: string } {
  let format = 'JPEG';
  let imageData = photoUrl;

  // Handle data URLs
  if (photoUrl.startsWith('data:image/png;base64,')) {
    format = 'PNG';
    // Extract base64 data - remove the data URL prefix
    imageData = photoUrl.substring('data:image/png;base64,'.length);
  } else if (photoUrl.startsWith('data:image/jpeg;base64,')) {
    format = 'JPEG';
    // Extract base64 data - remove the data URL prefix
    imageData = photoUrl.substring('data:image/jpeg;base64,'.length);
  } else if (photoUrl.startsWith('data:image/')) {
    // Extract format from data URL
    const formatMatch = photoUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
    if (formatMatch && formatMatch[1]) {
      format = formatMatch[1].toUpperCase();
      // Extract the base64 data only
      const prefix = `data:image/${formatMatch[1]};base64,`;
      imageData = photoUrl.substring(prefix.length);
    }
  }

  console.log(`Image format detected: ${format} for image URL starting with: ${photoUrl.substring(0, 30)}...`);
  console.log(`Image data length: ${imageData.length} characters`);

  return { imageData, format };
}

// Define template style configurations
interface TemplateStyle {
  titleFont: string;
  bodyFont: string;
  titleFontSize: number;
  subtitleFontSize: number;
  sectionTitleFontSize: number;
  bodyFontSize: number;
  lineHeight: number;
  primaryColor: [number, number, number]; // RGB color
  secondaryColor: [number, number, number]; // RGB color
  accentColor: [number, number, number]; // RGB color
  margin: number;
}

// Define template styles for our Executive template
const templateStyles = {
  'executive': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 18, // Name size - larger for emphasis
    subtitleFontSize: 12, // Section titles
    sectionTitleFontSize: 10, // Subsection titles
    bodyFontSize: 9, // Body text
    lineHeight: 4.5, // Slightly increased for better readability
    primaryColor: [45, 62, 80], // Deep navy blue - professional and distinctive
    secondaryColor: [80, 80, 80], // Dark gray for body text
    accentColor: [180, 150, 90], // Gold accent for visual elements
    margin: 18 // Slightly larger margins for a cleaner look
  }
};

/**
 * Generates a PDF document from CV data
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
  // Get template style (only executive is available now)
  const templateType: TemplateType = 'executive'; // Default to executive regardless of what's stored
  // Ensure we're using a valid template type
  const style = templateStyles['executive'];
  const includePhoto = data.templateSettings?.includePhoto || false;

  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const margin = style.margin;
  let yPos = margin;

  // Extract style properties for easier use
  const {
    titleFont, bodyFont, titleFontSize, subtitleFontSize, 
    sectionTitleFontSize, bodyFontSize, lineHeight,
    primaryColor, secondaryColor, accentColor
  } = style;

  // Use our standardized spacing constants for consistency
  // We'll use the helper functions addSectionSpacing and addEntrySpacing for all spacing

  // Calculate page width minus margins
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (margin * 2);

  // Apply template styling
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

  // Helper function to add consistent spacing after sections
  const addSectionSpacing = () => {
    yPos += SPACING.SECTION;
  };

  // Helper function to add consistent spacing after entries
  const addEntrySpacing = () => {
    yPos += SPACING.ENTRY;
  };

  // Helper function to safely format a date string
  function safeFormatDate(dateStr: string | undefined, options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' }): string {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
      return '';
    }
    
    try {
      return new Date(dateStr).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error("Error formatting date:", error, "Date string:", dateStr);
      return '';
    }
  }
  
  // Modern Sidebar layout is no longer used
  const isModernSidebar = false;
  if (false) { // This block will be skipped
    // Sidebar width (approx 1/3 of the page)
    const sidebarWidth = 60;
    const sidebarMargin = 10;
    const sidebarmainContentX = sidebarWidth + 5; // 5mm gap between sidebar and main content
    const sidebarmainContentWidth = pageWidth - sidebarmainContentX - margin;

    // Draw sidebar background
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]); // Yellow sidebar
    doc.rect(0, 0, sidebarWidth, pageHeight, 'F');

    // Start with photo if included
    const photoUrl = data.personal.photoUrl;
    let hasPhoto = includePhoto && photoUrl && typeof photoUrl === 'string';
    let sidebarYPos = margin + 10; // Start a bit lower in the sidebar

    if (hasPhoto) {
      try {
        // Circular photo effect in PDF (approximation with square photo)
        const photoSize = 40; // 40mm diameter
        const photoX = sidebarMargin;
        const photoY = sidebarYPos;

        // Process image with our helper
        const { imageData, format } = prepareImageForPDF(photoUrl!);
        console.log("Adding photo to sidebar, format:", format);

        try {
          // First try using the raw source
          doc.addImage(
            photoUrl!, 
            format, 
            photoX, 
            photoY, 
            photoSize, 
            photoSize
          );
          console.log("Image added successfully using full URL");
        } catch (e) {
          console.log("Failed to add image with full URL, trying with extracted data:", e);
          // If that fails, try with just the base64 data
          doc.addImage(
            imageData, 
            format, 
            photoX, 
            photoY, 
            photoSize, 
            photoSize
          );
          console.log("Image added successfully using extracted data");
        }

        sidebarYPos += photoSize + 15; // Space after photo
      } catch (error) {
        console.error("Error adding photo to PDF:", error, photoUrl);
        hasPhoto = false;
      }
    }

    // Add name to sidebar
    doc.setTextColor(255, 255, 255); // White text for sidebar
    doc.setFont(titleFont, "bold");
    doc.setFontSize(titleFontSize);

    // Split name to fit
    const nameText = `${data.personal.firstName} ${data.personal.lastName}`;
    const nameLines = doc.splitTextToSize(nameText, sidebarWidth - (sidebarMargin * 2));
    doc.text(nameLines, sidebarMargin, sidebarYPos);
    sidebarYPos += (nameLines.length * lineHeight) + 5;

    // Add contact info section in sidebar
    doc.setFont(titleFont, "bold");
    doc.setFontSize(subtitleFontSize - 2);
    doc.text("CONTACT", sidebarMargin, sidebarYPos);
    sidebarYPos += lineHeight + 2;

    // Contact details
    doc.setFont(bodyFont, "normal");
    doc.setFontSize(bodyFontSize);

    // Email
    doc.text(`Email:`, sidebarMargin, sidebarYPos);
    sidebarYPos += lineHeight - 3;
    doc.text(`${data.personal.email}`, sidebarMargin, sidebarYPos);
    sidebarYPos += lineHeight + 2;

    // Phone
    doc.text(`Phone:`, sidebarMargin, sidebarYPos);
    sidebarYPos += lineHeight - 3;
    doc.text(`${data.personal.phone}`, sidebarMargin, sidebarYPos);
    sidebarYPos += lineHeight + 2;

    // LinkedIn if available
    if (data.personal.linkedin) {
      doc.text(`LinkedIn:`, sidebarMargin, sidebarYPos);
      sidebarYPos += lineHeight - 3;
      doc.text(`linkedin.com/in/${data.personal.linkedin}`, sidebarMargin, sidebarYPos);
      sidebarYPos += lineHeight + 2;
    }

    // Technical skills section in sidebar
    if (data.keyCompetencies?.technicalSkills?.length > 0) {
      // Add some extra spacing before skills section
      sidebarYPos += 5;

      doc.setFont(titleFont, "bold");
      doc.setFontSize(subtitleFontSize - 2);
      doc.text("SKILLS", sidebarMargin, sidebarYPos);
      sidebarYPos += lineHeight + 2;

      doc.setFont(bodyFont, "normal");
      doc.setFontSize(bodyFontSize);

      // List technical skills
      for (const skill of data.keyCompetencies.technicalSkills) {
        const skillLines = doc.splitTextToSize(skill, sidebarWidth - (sidebarMargin * 2));
        doc.text(skillLines, sidebarMargin, sidebarYPos);
        sidebarYPos += (skillLines.length * lineHeight) + 1;

        // Prevent overflowing sidebar
        if (sidebarYPos > pageHeight - 20) {
          break;
        }
      }
    }

    // Start main content area
    let mainYPos = margin;
    // Use the same variables we defined above
    const mainContentX = sidebarmainContentX; 
    const mainContentWidth = sidebarmainContentWidth;

    // Set text color for main content
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    // Set up section order from user preferences or use default
    const defaultSectionOrder: SectionOrder[] = [
      { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
      { id: 'experience', name: 'Work Experience', visible: true, order: 1 },
      { id: 'education', name: 'Education', visible: true, order: 2 },
      { id: 'certificates', name: 'Certificates', visible: true, order: 3 },
      { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 4 },
      { id: 'additional', name: 'Additional Information', visible: true, order: 5 },
    ];

    // Use user-defined section order or fall back to default
    const sectionOrder = data.templateSettings?.sectionOrder?.filter(section => section.visible) || defaultSectionOrder;

    // Process main content sections based on order (except skills which are in sidebar)
    for (const section of sectionOrder) {
      // Skip hidden sections and skip keyCompetencies (already in sidebar)
      if (!section.visible || section.id === 'keyCompetencies') continue;

      // Add page break if needed
      if (mainYPos > doc.internal.pageSize.height - 40) {
        doc.addPage();
        // Add sidebar to new page
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
        mainYPos = margin;
      }

      switch (section.id) {
        case 'summary':
          // Professional Summary section
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("PROFILE", mainContentX, mainYPos);
          mainYPos += lineHeight + 2;

          // Yellow dot accent
          doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
          doc.circle(mainContentX + 3, mainYPos - 5, 1.5, 'F');

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);

          // Split text to handle line breaks if summary exists
          if (data.professional && data.professional.summary && typeof data.professional.summary === 'string') {
            const summaryLines = doc.splitTextToSize(data.professional.summary, mainContentWidth);
            doc.text(summaryLines, mainContentX, mainYPos);
            mainYPos += (summaryLines.length * lineHeight);
          }

          addSectionSpacing(); // Consistent spacing after section
          break;

        case 'experience':
          // Experience section
          if (data.experience && data.experience.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("EXPERIENCE", mainContentX, mainYPos);
            mainYPos += SPACING.LINE_BELOW_TITLE;
            // Add visual separator line under the title
            mainYPos = addSectionSeparator(doc, mainContentX, mainYPos, mainContentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
            mainYPos += lineHeight;

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

            for (const exp of data.experience) {
              // Check if we need a new page
              if (mainYPos > doc.internal.pageSize.height - 30) {
                doc.addPage();
                // Add sidebar to new page
                doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
                mainYPos = margin;
              }

              // Yellow dot accent
              doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
              doc.circle(mainContentX + 3, mainYPos - 1, 1.5, 'F');

              doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
              doc.setFont(titleFont, "bold");
              doc.setFontSize(sectionTitleFontSize);
              doc.text(exp.jobTitle, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              doc.setFont(bodyFont, "italic");
              doc.setFontSize(bodyFontSize);
              doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

              // Format dates using our safe formatter
              const startDate = safeFormatDate(exp.startDate);
              let endDateDisplay = '';
              if (exp.isCurrent) {
                endDateDisplay = 'Present';
              } else if (exp.endDate) {
                endDateDisplay = safeFormatDate(exp.endDate);
              }

              doc.text(`${exp.companyName} | ${startDate} - ${endDateDisplay}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              // Use our helper function for wrapped text if responsibilities exists  
              if (exp.responsibilities) {
                doc.setFont(bodyFont, "normal");
                mainYPos = addWrappedText(doc, exp.responsibilities, mainContentX + 8, mainYPos, mainContentWidth - 8, lineHeight);
              }

              // Only add entry spacing if this is not the last entry
              if (exp !== data.experience[data.experience.length - 1]) {
                addEntrySpacing(); // Consistent spacing between entries
              }
            }
          }

          // Add consistent spacing after the entire experience section
          addSectionSpacing(); // Consistent spacing after section
          break;

        case 'education':
          // Education section
          if (data.education && data.education.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("EDUCATION", mainContentX, mainYPos);
            mainYPos += SPACING.LINE_BELOW_TITLE;
            // Add visual separator line under the title
            mainYPos = addSectionSeparator(doc, mainContentX, mainYPos, mainContentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
            mainYPos += lineHeight;

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

            for (const edu of data.education) {
              if (mainYPos > doc.internal.pageSize.height - 30) {
                doc.addPage();
                // Add sidebar to new page
                doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
                mainYPos = margin;
              }

              // Yellow dot accent
              doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
              doc.circle(mainContentX + 3, mainYPos - 1, 1.5, 'F');

              doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
              doc.setFont(titleFont, "bold");
              doc.setFontSize(sectionTitleFontSize);
              doc.text(edu.major, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              doc.setFont(bodyFont, "italic");
              doc.setFontSize(bodyFontSize);
              doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

              // Format dates using our safe formatter
              const startDate = safeFormatDate(edu.startDate);
              const endDate = safeFormatDate(edu.endDate);

              doc.text(`${edu.schoolName} | ${startDate} - ${endDate}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              // Use our helper function for wrapped text if achievements exists
              if (edu.achievements) {
                doc.setFont(bodyFont, "normal");
                mainYPos = addWrappedText(doc, edu.achievements, mainContentX + 8, mainYPos, mainContentWidth - 8, lineHeight);
              }

              // Only add entry spacing if this is not the last entry
              if (edu !== data.education[data.education.length - 1]) {
                addEntrySpacing(); // Consistent spacing between entries
              }
            }
          }

          // Add consistent spacing after the entire education section
          addSectionSpacing(); // Consistent spacing after section
          break;

        case 'certificates':
          // Certificates section
          if (data.certificates && data.certificates.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("CERTIFICATES", mainContentX, mainYPos);
            mainYPos += SPACING.LINE_BELOW_TITLE;
            // Add visual separator line under the title
            mainYPos = addSectionSeparator(doc, mainContentX, mainYPos, mainContentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
            mainYPos += lineHeight;

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

            for (const cert of data.certificates) {
              if (mainYPos > doc.internal.pageSize.height - 30) {
                doc.addPage();
                // Add sidebar to new page
                doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
                mainYPos = margin;
              }

              // Yellow dot accent
              doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
              doc.circle(mainContentX + 3, mainYPos - 1, 1.5, 'F');

              doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
              doc.setFont(titleFont, "bold");
              doc.setFontSize(sectionTitleFontSize);
              doc.text(cert.name, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              doc.setFont(bodyFont, "italic");
              doc.setFontSize(bodyFontSize);
              doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

              // Format date using our safe formatter
              const dateAcquired = safeFormatDate(cert.dateAcquired);
              let expirationText = '';
              if (cert.expirationDate) {
                expirationText = ` (Expires: ${safeFormatDate(cert.expirationDate)})`;
              }

              doc.text(`${cert.institution} | ${dateAcquired}${expirationText}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              // Use our helper function for wrapped text if achievements exists
              if (cert.achievements) {
                doc.setFont(bodyFont, "normal");
                mainYPos = addWrappedText(doc, cert.achievements, mainContentX + 8, mainYPos, mainContentWidth - 8, lineHeight);
              }

              // Only add entry spacing if this is not the last entry
              if (cert !== data.certificates[data.certificates.length - 1]) {
                addEntrySpacing(); // Consistent spacing between entries
              }
            }
          }

          // Add extra spacing after the entire certificates section
          addSectionSpacing(); // Consistent spacing after section
          break;

        case 'extracurricular':
          // Extracurricular Activities section
          if (data.extracurricular && data.extracurricular.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("EXTRACURRICULAR", mainContentX, mainYPos);
            mainYPos += SPACING.LINE_BELOW_TITLE;
            // Add visual separator line under the title
            mainYPos = addSectionSeparator(doc, mainContentX, mainYPos, mainContentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
            mainYPos += lineHeight;

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

            for (const activity of data.extracurricular) {
              if (mainYPos > doc.internal.pageSize.height - 30) {
                doc.addPage();
                // Add sidebar to new page
                doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
                mainYPos = margin;
              }

              // Yellow dot accent
              doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
              doc.circle(mainContentX + 3, mainYPos - 1, 1.5, 'F');

              doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
              doc.setFont(titleFont, "bold");
              doc.setFontSize(sectionTitleFontSize);
              doc.text(activity.role, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              doc.setFont(bodyFont, "italic");
              doc.setFontSize(bodyFontSize);
              doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

              // Format dates using our safe formatter
              const startDate = safeFormatDate(activity.startDate);
              let endDateDisplay = '';
              if (activity.isCurrent) {
                endDateDisplay = 'Present';
              } else if (activity.endDate) {
                endDateDisplay = safeFormatDate(activity.endDate);
              }

              doc.text(`${activity.organization} | ${startDate} - ${endDateDisplay}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;

              // Use our helper function for wrapped text if description exists
              if (activity.description) {
                doc.setFont(bodyFont, "normal");
                mainYPos = addWrappedText(doc, activity.description, mainContentX + 8, mainYPos, mainContentWidth - 8, lineHeight);
              }

              // Only add entry spacing if this is not the last entry
              if (activity !== data.extracurricular[data.extracurricular.length - 1]) {
                addEntrySpacing(); // Consistent spacing between entries
              }
            }
          }

          // Add extra spacing after the entire extracurricular section
          addSectionSpacing(); // Consistent spacing after section
          break;

        case 'additional':
          // Additional Information section (Computer Skills and Languages)
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("ADDITIONAL INFORMATION", mainContentX, mainYPos);
          mainYPos += SPACING.LINE_BELOW_TITLE;
          // Add visual separator line under the title
          mainYPos = addSectionSeparator(doc, mainContentX, mainYPos, mainContentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
          mainYPos += lineHeight;

          // Computer Skills subsection
          if (data.additional && data.additional.skills && data.additional.skills.length > 0) {
            if (mainYPos > doc.internal.pageSize.height - 30) {
              doc.addPage();
              // Add sidebar to new page
              doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
              doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
              mainYPos = margin;
            }

            // Yellow dot accent
            doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.circle(mainContentX + 3, mainYPos - 1, 1.5, 'F');

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text("Computer Skills", mainContentX + 8, mainYPos);
            mainYPos += lineHeight;

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(bodyFont, "normal");
            doc.setFontSize(bodyFontSize);
            const skillsText = data.additional.skills.join(", ");
            mainYPos = addWrappedText(doc, skillsText, mainContentX + 8, mainYPos, mainContentWidth - 8, lineHeight);
            mainYPos += SPACING.SUB_SECTION; // Standardized spacing between subsections
          }

          // Languages subsection
          if (data.languages && data.languages.length > 0) {
            if (mainYPos > doc.internal.pageSize.height - 30) {
              doc.addPage();
              // Add sidebar to new page
              doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
              doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
              mainYPos = margin;
            }

            // Yellow dot accent
            doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.circle(mainContentX + 3, mainYPos - 1, 1.5, 'F');

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text("Languages", mainContentX + 8, mainYPos);
            mainYPos += lineHeight;

            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont(bodyFont, "normal");
            doc.setFontSize(bodyFontSize);

            const languagesText = data.languages.map(lang => 
              `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
            ).join(", ");
            
            mainYPos = addWrappedText(doc, languagesText, mainContentX + 8, mainYPos, mainContentWidth - 8, lineHeight);
          }

          // Add consistent spacing after the entire Additional Information section
          addSectionSpacing(); // Consistent spacing after section
          break;
      }
    }

    // Convert ArrayBuffer to Buffer for compatibility
    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }

  // All other templates use standard layout
  // Set up the layout with photo if included
  const photoUrl = data.personal.photoUrl;
  let hasPhoto = includePhoto && photoUrl && typeof photoUrl === 'string';

  if (hasPhoto) {
    // Define photo position and dimensions
    const photoSize = 40; // Size in mm (about 1.5 inches)
    const photoX = pageWidth - margin - photoSize;
    const photoY = margin;

    try {
      // Process image with our helper
      const { imageData, format } = prepareImageForPDF(photoUrl!);
      console.log("Adding photo to standard template, format:", format);

      // Add the photo to the document with non-null assertion for TypeScript
      try {
        // First try using the raw source
        doc.addImage(
          photoUrl!, // Non-null assertion as we've already checked
          format, 
          photoX, 
          photoY, 
          photoSize, 
          photoSize
        );
        console.log("Image added successfully to standard template using full URL");
      } catch (e) {
        console.log("Failed to add image to standard template with full URL, trying with extracted data:", e);
        // If that fails, try with just the base64 data
        doc.addImage(
          imageData, 
          format, 
                    photoX, 
          photoY, 
          photoSize, 
          photoSize
        );
        console.log("Image added successfully to standard template using extracted data");
      }

      // Adjust content width to account for photo
      const textWidth = photoX - margin - 5; // 5mm buffer between text and photo

      // Add header with name
      doc.setFont(titleFont, "bold");
      doc.setFontSize(titleFontSize);

      // Split name to multiple lines if needed
      const nameText = `${data.personal.firstName} ${data.personal.lastName}`;
      const nameLines = doc.splitTextToSize(nameText, textWidth);
      doc.text(nameLines, margin, yPos);
      yPos += (nameLines.length * lineHeight);

      // Add contact information
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont(bodyFont, "normal");
      doc.setFontSize(bodyFontSize);

      // Email and phone
      const contactText = `Email: ${data.personal.email} | Phone: ${data.personal.phone}`;
      const contactLines = doc.splitTextToSize(contactText, textWidth);
      doc.text(contactLines, margin, yPos);
      yPos += (contactLines.length * lineHeight);

      // LinkedIn if available
      if (data.personal.linkedin) {
        const linkedinText = `LinkedIn: linkedin.com/in/${data.personal.linkedin}`;
        const linkedinLines = doc.splitTextToSize(linkedinText, textWidth);
        doc.text(linkedinLines, margin, yPos);
        yPos += (linkedinLines.length * lineHeight);
      }

      // Ensure we've moved past the photo
      const photoBottom = photoY + photoSize + 5;
      if (yPos < photoBottom) {
        yPos = photoBottom;
      }
    } catch (error) {
      console.error("Error adding photo to PDF:", error, "Photo URL:", photoUrl);
      // If photo fails, revert to standard layout
      console.log("Fallback to standard layout without photo");
      hasPhoto = false;
    }
  }

  // Standard layout (no photo)
  if (!hasPhoto && !isModernSidebar) {
    // Add header with name
    doc.setFont(titleFont, "bold");
    doc.setFontSize(titleFontSize);
    doc.text(`${data.personal.firstName} ${data.personal.lastName}`, margin, yPos);
    yPos += SPACING.LINE_BELOW_TITLE;

    // Add contact information
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont(bodyFont, "normal");
    doc.setFontSize(bodyFontSize);
    doc.text(`Email: ${data.personal.email} | Phone: ${data.personal.phone}`, margin, yPos);
    yPos += lineHeight;

    if (data.personal.linkedin) {
      doc.text(`LinkedIn: linkedin.com/in/${data.personal.linkedin}`, margin, yPos);
      yPos += lineHeight;
    }
  }

  // Add horizontal line for non-sidebar templates
  if (!isModernSidebar) {
    yPos += 3;
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += SPACING.ENTRY; // Standardized spacing after separator line
  }

  // Set up section order from user preferences or use default if not defined
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

  // Process sections based on order
  for (const section of sectionOrder) {
    // Skip hidden sections
    if (!section.visible) continue;

    // Add page break if needed
    if (yPos > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPos = margin;
    }

    switch (section.id) {
      case 'summary':
        // Professional Summary section
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(titleFont, "bold");
        doc.setFontSize(subtitleFontSize);
        doc.text("Professional Summary", margin, yPos);

        // Add visual separator line under the title
        yPos += SPACING.LINE_BELOW_TITLE; 
        yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
        yPos += lineHeight;

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont(bodyFont, "normal");
        doc.setFontSize(bodyFontSize);

        // Use our helper function for wrapped text if summary exists
        if (data.professional && data.professional.summary) {
          yPos = addWrappedText(doc, data.professional.summary, margin, yPos, contentWidth, lineHeight);
        }

        // Add consistent spacing after this section
        addSectionSpacing();
        break;

      case 'keyCompetencies':
        // Key Competencies section
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(titleFont, "bold");
        doc.setFontSize(subtitleFontSize);
        doc.text("Key Competencies", margin, yPos);

        // Add visual separator line under the title
        yPos += SPACING.LINE_BELOW_TITLE;
        yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
        yPos += lineHeight;

        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

        // Technical Skills
        if (data.keyCompetencies?.technicalSkills?.length > 0) {
          doc.setFont(titleFont, "bold");
          doc.setFontSize(sectionTitleFontSize);
          doc.text("Technical Skills", margin, yPos);
          yPos += lineHeight;

          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);
          const techSkillsText = data.keyCompetencies.technicalSkills.join(", ");
          yPos = addWrappedText(doc, techSkillsText, margin, yPos, contentWidth, lineHeight);
          yPos += SPACING.SUB_SECTION; // Space between sub-sections
        }

        // Soft Skills
        if (data.keyCompetencies?.softSkills?.length > 0) {
          doc.setFont(titleFont, "bold");
          doc.setFontSize(sectionTitleFontSize);
          doc.text("Soft Skills", margin, yPos);
          yPos += lineHeight;

          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);
          const softSkillsText = data.keyCompetencies.softSkills.join(", ");
          yPos = addWrappedText(doc, softSkillsText, margin, yPos, contentWidth, lineHeight);
        }

        // Add consistent spacing after this section
        addSectionSpacing();
        break;

      case 'experience':
        // Experience section
        if (data.experience && data.experience.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Professional Experience", margin, yPos);

          // Add visual separator line under the title
          yPos += SPACING.LINE_BELOW_TITLE; 
          yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
          yPos += lineHeight;

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

          for (const exp of data.experience) {
            // Check if we need a new page
            if (yPos > doc.internal.pageSize.height - 30) {
              doc.addPage();
              yPos = margin;
            }

            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(exp.jobTitle, margin, yPos);
            yPos += lineHeight;

            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);

            // Format dates with safe null checks
            const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            let endDateDisplay = '';
            if (exp.isCurrent) {
              endDateDisplay = 'Present';
            } else if (exp.endDate) {
              endDateDisplay = new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            doc.text(`${exp.companyName} | ${startDate} - ${endDateDisplay}`, margin, yPos);
            yPos += lineHeight;

            if (exp.responsibilities) {
              doc.setFont(bodyFont, "normal");
              yPos = addWrappedText(doc, exp.responsibilities, margin, yPos, contentWidth, lineHeight);
            }

            // Only add entry spacing if this is not the last entry
            if (exp !== data.experience[data.experience.length - 1]) {
              addEntrySpacing(); // Standard spacing between entries
            }
          }

          // Add consistent spacing after the entire experience section
          addSectionSpacing(); // Consistent spacing after section
        }
        break;

      case 'education':
        // Education section
        if (data.education && data.education.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Education", margin, yPos);
          
          // Add visual separator line under the title for consistency with other sections
          yPos += SPACING.LINE_BELOW_TITLE;
          yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
          yPos += lineHeight;

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

          for (const edu of data.education) {
            if (yPos > doc.internal.pageSize.height - 30) {
              doc.addPage();
              yPos = margin;
            }

            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(edu.major, margin, yPos);
            yPos += lineHeight;

            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);

            // Format dates
            const startDate = edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            const endDate = edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

            doc.text(`${edu.schoolName} | ${startDate} - ${endDate}`, margin, yPos);
            yPos += lineHeight;

            if (edu.achievements && typeof edu.achievements === 'string') {
              doc.setFont(bodyFont, "normal");
              const achievementsLines = doc.splitTextToSize(edu.achievements, contentWidth);
              doc.text(achievementsLines, margin, yPos);
              yPos += (achievementsLines.length * lineHeight);
            }

            // Only add entry spacing if this is not the last entry
            if (edu !== data.education[data.education.length - 1]) {
              addEntrySpacing(); // Spacing between education entries
            }
          }

          // Add consistent spacing after the education section
          addSectionSpacing(); // 7 units consistent spacing
        }
        break;

      case 'certificates':
        // Certificates section
        if (data.certificates && data.certificates.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Certificates", margin, yPos);
          
          // Add visual separator line under the title for consistency with other sections
          yPos += SPACING.LINE_BELOW_TITLE;
          yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
          yPos += lineHeight;

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

          for (const cert of data.certificates) {
            if (yPos > doc.internal.pageSize.height - 30) {
              doc.addPage();
              yPos = margin;
            }

            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(cert.name, margin, yPos);
            yPos += lineHeight;

            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);

            // Format date with safe null checks
            const dateAcquired = cert.dateAcquired ? new Date(cert.dateAcquired).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            let expirationText = '';
            if (cert.expirationDate) {
              expirationText = ` (Expires: ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;
            }

            doc.text(`${cert.institution} | ${dateAcquired}${expirationText}`, margin, yPos);
            yPos += lineHeight;

            if (cert.achievements && typeof cert.achievements === 'string') {
              doc.setFont(bodyFont, "normal");
              const achievementsLines = doc.splitTextToSize(cert.achievements, contentWidth);
              doc.text(achievementsLines, margin, yPos);
              yPos += (achievementsLines.length * lineHeight);
            }

            // Only add entry spacing if this is not the last entry
            if (cert !== data.certificates[data.certificates.length - 1]) {
              addEntrySpacing(); // Spacing between certificate entries
            }
          }

          // Add consistent spacing after the entire certificates section
          addSectionSpacing(); // 7 units consistent spacing after section
        }
        break;

      case 'extracurricular':
        // Extracurricular Activities section
        if (data.extracurricular && data.extracurricular.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Extracurricular Activities", margin, yPos);
          
          // Add visual separator line under the title for consistency with other sections
          yPos += SPACING.LINE_BELOW_TITLE;
          yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
          yPos += lineHeight;

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

          for (const activity of data.extracurricular) {
            if (yPos > doc.internal.pageSize.height - 30) {
              doc.addPage();
              yPos = margin;
            }

            doc.setFont(titleFont, "bold");
            doc.setFontSize(sectionTitleFontSize);
            doc.text(activity.role, margin, yPos);
            yPos += lineHeight;

            doc.setFont(bodyFont, "italic");
            doc.setFontSize(bodyFontSize);

            // Format dates with safe null checks
            const startDate = activity.startDate ? new Date(activity.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            let endDateDisplay = '';
            if (activity.isCurrent) {
              endDateDisplay = 'Present';
            } else if (activity.endDate) {
              endDateDisplay = new Date(activity.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }

            doc.text(`${activity.organization} | ${startDate} - ${endDateDisplay}`, margin, yPos);
            yPos += lineHeight;

            if (activity.description && typeof activity.description === 'string') {
              doc.setFont(bodyFont, "normal");
              const descriptionLines = doc.splitTextToSize(activity.description, contentWidth);
              doc.text(descriptionLines, margin, yPos);
              yPos += (descriptionLines.length * lineHeight);
            }

            // Only add entry spacing if this is not the last entry
            if (activity !== data.extracurricular[data.extracurricular.length - 1]) {
              addEntrySpacing(); // Spacing between extracurricular entries
            }
          }

          // Add consistent spacing after the extracurricular section
          addSectionSpacing(); // 7 units consistent spacing
        }
        break;

      case 'additional':
        // Additional Info section (skills and languages)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(titleFont, "bold");
        doc.setFontSize(subtitleFontSize);
        doc.text("Additional Information", margin, yPos);
        
        // Add visual separator line under the title for consistency with other sections
        yPos += SPACING.LINE_BELOW_TITLE;
        yPos = addSectionSeparator(doc, margin, yPos, contentWidth * 0.25, [primaryColor[0], primaryColor[1], primaryColor[2]]);
        yPos += lineHeight;

        // Additional Skills subsection
        if (data.additional && data.additional.skills && data.additional.skills.length > 0) {
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(sectionTitleFontSize);
          doc.text("Computer Skills", margin, yPos);
          yPos += lineHeight;

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);
          const skillsText = data.additional.skills.join(", ");
          const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
          doc.text(skillsLines, margin, yPos);
          yPos += (skillsLines.length * lineHeight) + SPACING.SUB_SECTION; // Consistent spacing between subsections
        }

        // Languages subsection
        if (data.languages && data.languages.length > 0) {
          if (yPos > doc.internal.pageSize.height - 30) {
            doc.addPage();
            yPos = margin;
          }

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(sectionTitleFontSize);
          doc.text("Languages", margin, yPos);
          yPos += lineHeight;

          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);

          const languagesText = data.languages.map(lang => 
            `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
          ).join(", ");

          const languagesLines = doc.splitTextToSize(languagesText, contentWidth);
          doc.text(languagesLines, margin, yPos);
          yPos += (languagesLines.length * lineHeight);
        }

        // Add consistent spacing after the entire Additional Information section
        addSectionSpacing(); // 7 units consistent spacing after section
        break;

      default:
        break;
    }
  }

  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}