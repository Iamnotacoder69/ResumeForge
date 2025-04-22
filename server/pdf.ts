import { jsPDF } from "jspdf";
import { CompleteCV, SectionOrder, TemplateType } from "@shared/types";

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

const templateStyles: Record<TemplateType, TemplateStyle> = {
  'minimalist': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 16,
    subtitleFontSize: 13,
    sectionTitleFontSize: 11,
    bodyFontSize: 10,
    lineHeight: 6,
    primaryColor: [50, 50, 50],
    secondaryColor: [100, 100, 100],
    accentColor: [150, 150, 150],
    margin: 20
  },
  'professional': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 18,
    subtitleFontSize: 14,
    sectionTitleFontSize: 12,
    bodyFontSize: 10,
    lineHeight: 7,
    primaryColor: [0, 62, 116],
    secondaryColor: [70, 70, 70],
    accentColor: [0, 103, 164],
    margin: 20
  },
  'creative': {
    titleFont: "helvetica",
    bodyFont: "helvetica",
    titleFontSize: 22,
    subtitleFontSize: 16,
    sectionTitleFontSize: 14,
    bodyFontSize: 10,
    lineHeight: 7,
    primaryColor: [142, 68, 173],
    secondaryColor: [80, 80, 80],
    accentColor: [187, 143, 206],
    margin: 22
  },
  'academic': {
    titleFont: "times",
    bodyFont: "times",
    titleFontSize: 18,
    subtitleFontSize: 14,
    sectionTitleFontSize: 12,
    bodyFontSize: 10,
    lineHeight: 7,
    primaryColor: [15, 82, 87],
    secondaryColor: [70, 70, 70],
    accentColor: [36, 128, 116],
    margin: 25
  }
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
  const contentWidth = pageWidth - (margin * 2);
  
  // Apply template styling
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  // Set up the layout with photo if included
  const photoUrl = data.personal.photoUrl;
  let hasPhoto = includePhoto && photoUrl && typeof photoUrl === 'string';
  
  if (hasPhoto) {
    // Define photo position and dimensions
    const photoSize = 40; // Size in mm (about 1.5 inches)
    const photoX = pageWidth - margin - photoSize;
    const photoY = margin;
    
    try {
      // Add the photo to the document with non-null assertion for TypeScript
      doc.addImage(
        photoUrl!, // Non-null assertion as we've already checked
        'JPEG', 
        photoX, 
        photoY, 
        photoSize, 
        photoSize
      );
      
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
      console.error("Error adding photo to PDF:", error);
      // If photo fails, revert to standard layout
      hasPhoto = false;
    }
  }
  
  // Standard layout (no photo)
  if (!hasPhoto) {
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
  
  // Add horizontal line
  yPos += 3;
  doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;
  
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
        yPos += (summaryLines.length * lineHeight) + 5;
        break;
        
      case 'keyCompetencies':
        // Key Competencies section
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont(titleFont, "bold");
        doc.setFontSize(subtitleFontSize);
        doc.text("Key Competencies", margin, yPos);
        yPos += lineHeight + 2;
        
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
          yPos += (techSkillsLines.length * lineHeight) + 3;
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
          yPos += (softSkillsLines.length * lineHeight) + 5;
        }
        break;
        
      case 'experience':
        // Experience section
        if (data.experience && data.experience.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Professional Experience", margin, yPos);
          yPos += lineHeight + 2;
          
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
            const responsibilitiesLines = doc.splitTextToSize(exp.responsibilities, contentWidth);
            doc.text(responsibilitiesLines, margin, yPos);
            yPos += (responsibilitiesLines.length * lineHeight) + 5;
          }
        }
        break;
        
      case 'education':
        // Education section
        if (data.education && data.education.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Education", margin, yPos);
          yPos += lineHeight + 2;
          
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
            
            yPos += 5;
          }
        }
        break;
        
      case 'certificates':
        // Certificates section
        if (data.certificates && data.certificates.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Certificates", margin, yPos);
          yPos += lineHeight + 2;
          
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
            
            yPos += 5;
          }
        }
        break;
        
      case 'extracurricular':
        // Extracurricular Activities section
        if (data.extracurricular && data.extracurricular.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Extracurricular Activities", margin, yPos);
          yPos += lineHeight + 2;
          
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
            yPos += (descriptionLines.length * lineHeight) + 5;
          }
        }
        break;
        
      case 'additional':
        // Additional Info section (skills)
        if (data.additional && data.additional.skills && data.additional.skills.length > 0) {
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont(titleFont, "bold");
          doc.setFontSize(subtitleFontSize);
          doc.text("Additional Skills", margin, yPos);
          yPos += lineHeight;
          
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont(bodyFont, "normal");
          doc.setFontSize(bodyFontSize);
          const skillsText = data.additional.skills.join(", ");
          const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
          doc.text(skillsLines, margin, yPos);
          yPos += (skillsLines.length * lineHeight) + 5;
        }
        break;
        
      default:
        break;
    }
  }
  
  // Languages section (always include this at the end)
  if (data.languages && data.languages.length > 0) {
    if (yPos > doc.internal.pageSize.height - 30) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont(titleFont, "bold");
    doc.setFontSize(subtitleFontSize);
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
  }
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}