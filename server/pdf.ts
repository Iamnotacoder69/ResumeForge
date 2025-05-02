import { jsPDF } from "jspdf";
import { CompleteCV, SectionOrder, TemplateType } from "@shared/types";

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

// Define template styles for each template type
const templateStyles = {
  'minimalist': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 14, // Name size only
    subtitleFontSize: 11, // Section titles
    sectionTitleFontSize: 11, // Subsection titles
    bodyFontSize: 11, // Body text
    lineHeight: 3.5,  // Reduced further from 4
    primaryColor: [50, 50, 50],
    secondaryColor: [100, 100, 100],
    accentColor: [150, 150, 150],
    margin: 15      // Reduced from 20
  },
  'professional': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 14, // Name size only
    subtitleFontSize: 11, // Section titles
    sectionTitleFontSize: 11, // Subsection titles
    bodyFontSize: 11, // Body text
    lineHeight: 4,
    primaryColor: [0, 62, 116],
    secondaryColor: [70, 70, 70],
    accentColor: [0, 103, 164],
    margin: 15
  },
  'creative': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 14, // Name size only
    subtitleFontSize: 11, // Section titles
    sectionTitleFontSize: 11, // Subsection titles
    bodyFontSize: 11, // Body text
    lineHeight: 4,
    primaryColor: [142, 68, 173],
    secondaryColor: [80, 80, 80],
    accentColor: [187, 143, 206],
    margin: 15
  },
  'academic': {
    titleFont: "times",
    bodyFont: "times",
    titleFontSize: 14, // Name size only
    subtitleFontSize: 11, // Section titles
    sectionTitleFontSize: 11, // Subsection titles
    bodyFontSize: 11, // Body text
    lineHeight: 4,
    primaryColor: [15, 82, 87],
    secondaryColor: [70, 70, 70],
    accentColor: [36, 128, 116],
    margin: 15
  }
  // modern-sidebar template removed
};

/**
 * Generates a PDF document from CV data
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
  // Get template style based on user selection or default to professional
  const templateType = data.templateSettings?.template || 'professional';
  const style = templateStyles[templateType];
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
  
  // Calculate page width minus margins
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const contentWidth = pageWidth - (margin * 2);
  
  // Apply template styling
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
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
          
          // Split text to handle line breaks
          const summaryLines = doc.splitTextToSize(data.professional.summary, mainContentWidth);
          doc.text(summaryLines, mainContentX, mainYPos);
          mainYPos += (summaryLines.length * lineHeight) + 15; // Increased for better section separation
          break;
          
        case 'experience':
          // Experience section
          if (data.experience && data.experience.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("EXPERIENCE", mainContentX, mainYPos);
            mainYPos += lineHeight + 2;
            
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
              
              // Format dates
              const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const endDateDisplay = exp.isCurrent ? 'Present' : 
                                 exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
              
              doc.text(`${exp.companyName} | ${startDate} - ${endDateDisplay}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;
              
              doc.setFont(bodyFont, "normal");
              const responsibilitiesLines = doc.splitTextToSize(exp.responsibilities, mainContentWidth - 8);
              doc.text(responsibilitiesLines, mainContentX + 8, mainYPos);
              mainYPos += (responsibilitiesLines.length * lineHeight) + 7; // Balanced spacing between experience entries
            }
          }
          
          // Add extra spacing after the entire experience section
          mainYPos += 7;
          break;
          
        case 'education':
          // Education section
          if (data.education && data.education.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("EDUCATION", mainContentX, mainYPos);
            mainYPos += lineHeight + 2;
            
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
              
              // Format dates
              const startDate = new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const endDate = new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              
              doc.text(`${edu.schoolName} | ${startDate} - ${endDate}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;
              
              if (edu.achievements) {
                doc.setFont(bodyFont, "normal");
                const achievementsLines = doc.splitTextToSize(edu.achievements, mainContentWidth - 8);
                doc.text(achievementsLines, mainContentX + 8, mainYPos);
                mainYPos += (achievementsLines.length * lineHeight);
              }
              
              mainYPos += 10; // Increased spacing between education entries
            }
          }
          
          // Add extra spacing after the entire education section
          mainYPos += 7;
          break;
          
        case 'certificates':
          // Certificates section
          if (data.certificates && data.certificates.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("CERTIFICATES", mainContentX, mainYPos);
            mainYPos += lineHeight + 2;
            
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
              
              // Format date
              const dateAcquired = new Date(cert.dateAcquired).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const expirationText = cert.expirationDate ? 
                                 ` (Expires: ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : '';
              
              doc.text(`${cert.institution} | ${dateAcquired}${expirationText}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;
              
              if (cert.achievements) {
                doc.setFont(bodyFont, "normal");
                const achievementsLines = doc.splitTextToSize(cert.achievements, mainContentWidth - 8);
                doc.text(achievementsLines, mainContentX + 8, mainYPos);
                mainYPos += (achievementsLines.length * lineHeight);
              }
              
              mainYPos += 5; // Balanced spacing between certificate entries
            }
          }
          
          // Add extra spacing after the entire certificates section
          mainYPos += 7; // 7 units consistent spacing after section
          break;
          
        case 'extracurricular':
          // Extracurricular Activities section
          if (data.extracurricular && data.extracurricular.length > 0) {
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFont(titleFont, "bold");
            doc.setFontSize(subtitleFontSize);
            doc.text("EXTRACURRICULAR", mainContentX, mainYPos);
            mainYPos += lineHeight + 2;
            
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
              
              // Format dates
              const startDate = new Date(activity.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              const endDateDisplay = activity.isCurrent ? 'Present' : 
                activity.endDate ? new Date(activity.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
              
              doc.text(`${activity.organization} | ${startDate} - ${endDateDisplay}`, mainContentX + 8, mainYPos);
              mainYPos += lineHeight;
              
              doc.setFont(bodyFont, "normal");
              const descriptionLines = doc.splitTextToSize(activity.description, mainContentWidth - 8);
              doc.text(descriptionLines, mainContentX + 8, mainYPos);
              mainYPos += (descriptionLines.length * lineHeight) + 5; // Balanced spacing between extracurricular entries
            }
          }
          
          // Add extra spacing after the entire extracurricular section
          mainYPos += 7; // 7 units consistent spacing after section
          break;
          
        case 'additional':
          // Additional Information section (Computer Skills and Languages)
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("ADDITIONAL INFORMATION", mainContentX, mainYPos);
          mainYPos += lineHeight + 2;
          
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
            const skillsLines = doc.splitTextToSize(skillsText, mainContentWidth - 8);
            doc.text(skillsLines, mainContentX + 8, mainYPos);
            mainYPos += (skillsLines.length * lineHeight) + 5; // Spacing between subsections
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
            
            const languagesLines = doc.splitTextToSize(languagesText, mainContentWidth - 8);
            doc.text(languagesLines, mainContentX + 8, mainYPos);
            mainYPos += (languagesLines.length * lineHeight);
          }
          
          // Add consistent spacing after the entire Additional Information section
          mainYPos += 7; // 7 units consistent spacing after section
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
    yPos += lineHeight + 2;
    
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
    yPos += 5;
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
        yPos += lineHeight;
        
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont(bodyFont, "normal");
        doc.setFontSize(bodyFontSize);
        
        // Split text to handle line breaks
        const summaryLines = doc.splitTextToSize(data.professional.summary, contentWidth);
        doc.text(summaryLines, margin, yPos);
        // Add consistent spacing after this section
        yPos += (summaryLines.length * lineHeight) + 7; // 7 units consistent spacing after section
        break;
        
      case 'keyCompetencies':
        // Key Competencies section
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(titleFont, "bold");
        doc.setFontSize(subtitleFontSize);
        doc.text("Key Competencies", margin, yPos);
        yPos += lineHeight + 1;
        
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
          const techSkillsLines = doc.splitTextToSize(techSkillsText, contentWidth);
          doc.text(techSkillsLines, margin, yPos);
          yPos += (techSkillsLines.length * lineHeight) + 2; // Reduced from 3
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
          const softSkillsLines = doc.splitTextToSize(softSkillsText, contentWidth);
          doc.text(softSkillsLines, margin, yPos);
          yPos += (softSkillsLines.length * lineHeight) + 7; // 7 units consistent spacing after section
        }
        break;
        
      case 'experience':
        // Experience section
        if (data.experience && data.experience.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Professional Experience", margin, yPos);
          yPos += lineHeight + 1;
          
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
            
            // Format dates
            const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endDateDisplay = exp.isCurrent ? 'Present' : 
                               exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            
            doc.text(`${exp.companyName} | ${startDate} - ${endDateDisplay}`, margin, yPos);
            yPos += lineHeight;
            
            doc.setFont(bodyFont, "normal");
            
            // Handle bullet points in responsibilities
            const responsibilities = exp.responsibilities.split('\n').filter(item => item.trim().length > 0);
            let bulletYPos = yPos;
            
            for (const responsibility of responsibilities) {
              // Clean the text (remove leading bullet if exists)
              let responsibilityText = responsibility.trim();
              if (responsibilityText.startsWith('•')) {
                responsibilityText = responsibilityText.substring(1).trim();
              }
              
              // Add bullet point
              doc.setFont(bodyFont, "normal");
              const textLines = doc.splitTextToSize(responsibilityText, contentWidth - 4);
              
              // Draw bullet
              doc.text('•', margin, bulletYPos);
              
              // Draw text with indent
              doc.text(textLines, margin + 4, bulletYPos);
              
              // Move to next line
              bulletYPos += (textLines.length * lineHeight);
            }
            
            // Update overall Y position
            yPos = bulletYPos;
            yPos += 6; // Balanced spacing between experience entries
          }
          
          // Add extra spacing after the entire experience section
          yPos += 7;
        }
        break;
        
      case 'education':
        // Education section
        if (data.education && data.education.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Education", margin, yPos);
          yPos += lineHeight + 1;
          
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
            const startDate = new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endDate = new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            doc.text(`${edu.schoolName} | ${startDate} - ${endDate}`, margin, yPos);
            yPos += lineHeight;
            
            if (edu.achievements) {
              doc.setFont(bodyFont, "normal");
              const achievementsLines = doc.splitTextToSize(edu.achievements, contentWidth);
              doc.text(achievementsLines, margin, yPos);
              yPos += (achievementsLines.length * lineHeight);
            }
            
            yPos += 5; // Balanced spacing between education entries
          }
          
          // Add consistent spacing after the education section
          yPos += 7; // 7 units consistent spacing
        }
        break;
        
      case 'certificates':
        // Certificates section
        if (data.certificates && data.certificates.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Certificates", margin, yPos);
          yPos += lineHeight + 1;
          
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
            
            // Format date
            const dateAcquired = new Date(cert.dateAcquired).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const expirationText = cert.expirationDate ? 
                               ` (Expires: ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : '';
            
            doc.text(`${cert.institution} | ${dateAcquired}${expirationText}`, margin, yPos);
            yPos += lineHeight;
            
            if (cert.achievements) {
              doc.setFont(bodyFont, "normal");
              const achievementsLines = doc.splitTextToSize(cert.achievements, contentWidth);
              doc.text(achievementsLines, margin, yPos);
              yPos += (achievementsLines.length * lineHeight);
            }
            
            yPos += 5; // Balanced spacing between certificate entries
          }
          
          // Add extra spacing after the entire certificates section
          yPos += 7;
        }
        break;
        
      case 'extracurricular':
        // Extracurricular Activities section
        if (data.extracurricular && data.extracurricular.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Extracurricular Activities", margin, yPos);
          yPos += lineHeight + 1;
          
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
            
            // Format dates
            const startDate = new Date(activity.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endDateDisplay = activity.isCurrent ? 'Present' : 
                               activity.endDate ? new Date(activity.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            
            doc.text(`${activity.organization} | ${startDate} - ${endDateDisplay}`, margin, yPos);
            yPos += lineHeight;
            
            doc.setFont(bodyFont, "normal");
            const descriptionLines = doc.splitTextToSize(activity.description, contentWidth);
            doc.text(descriptionLines, margin, yPos);
            yPos += (descriptionLines.length * lineHeight) + 5; // Balanced spacing between extracurricular entries
          }
          
          // Add consistent spacing after the extracurricular section
          yPos += 7; // 7 units consistent spacing
        }
        break;
        
      case 'additional':
        // Additional Info section (skills and languages)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(titleFont, "bold");
        doc.setFontSize(subtitleFontSize);
        doc.text("Additional Information", margin, yPos);
        yPos += lineHeight + 1;
        
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
          yPos += (skillsLines.length * lineHeight) + 5; // Spacing between subsections
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
        yPos += 7; // 7 units consistent spacing after section
        break;
        
      default:
        break;
    }
  }
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}