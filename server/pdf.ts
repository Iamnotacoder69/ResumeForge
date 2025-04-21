import { jsPDF } from "jspdf";
import { CompleteCV } from "@shared/types";

/**
 * Generates a PDF document from CV data
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const margin = 20;
  let yPos = margin;
  
  // Define styles
  const titleFont = "helvetica";
  const bodyFont = "helvetica";
  const titleFontSize = 18;
  const subtitleFontSize = 14;
  const sectionTitleFontSize = 12;
  const bodyFontSize = 10;
  const lineHeight = 7;
  
  // Calculate page width minus margins
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - (margin * 2);
  
  // Add header with name
  doc.setFont(titleFont, "bold");
  doc.setFontSize(titleFontSize);
  doc.text(`${data.personal.firstName} ${data.personal.lastName}`, margin, yPos);
  yPos += lineHeight + 2;
  
  // Add contact information
  doc.setFont(bodyFont, "normal");
  doc.setFontSize(bodyFontSize);
  doc.text(`Email: ${data.personal.email} | Phone: ${data.personal.phone}`, margin, yPos);
  yPos += lineHeight;
  
  if (data.personal.linkedin) {
    doc.text(`LinkedIn: linkedin.com/in/${data.personal.linkedin}`, margin, yPos);
    yPos += lineHeight;
  }
  
  // Add horizontal line
  yPos += 3;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 5;
  
  // Professional Summary
  doc.setFont(titleFont, "bold");
  doc.setFontSize(subtitleFontSize);
  doc.text("Professional Summary", margin, yPos);
  yPos += lineHeight;
  
  doc.setFont(bodyFont, "normal");
  doc.setFontSize(bodyFontSize);
  
  // Split text to handle line breaks
  const summaryLines = doc.splitTextToSize(data.professional.summary, contentWidth);
  doc.text(summaryLines, margin, yPos);
  yPos += (summaryLines.length * lineHeight) + 5;
  
  // Experience section
  doc.setFont(titleFont, "bold");
  doc.setFontSize(subtitleFontSize);
  doc.text("Professional Experience", margin, yPos);
  yPos += lineHeight + 2;
  
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
  
  // Education section
  if (yPos > doc.internal.pageSize.height - 40) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFont(titleFont, "bold");
  doc.setFontSize(subtitleFontSize);
  doc.text("Education", margin, yPos);
  yPos += lineHeight + 2;
  
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
  
  // Certificates section (if exists)
  if (data.certificates && data.certificates.length > 0) {
    if (yPos > doc.internal.pageSize.height - 40) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFont(titleFont, "bold");
    doc.setFontSize(subtitleFontSize);
    doc.text("Certificates", margin, yPos);
    yPos += lineHeight + 2;
    
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
  
  // Skills and Languages
  if (yPos > doc.internal.pageSize.height - 40) {
    doc.addPage();
    yPos = margin;
  }
  
  // Skills section
  doc.setFont(titleFont, "bold");
  doc.setFontSize(subtitleFontSize);
  doc.text("Skills", margin, yPos);
  yPos += lineHeight;
  
  doc.setFont(bodyFont, "normal");
  doc.setFontSize(bodyFontSize);
  const skillsText = data.additional.skills.join(", ");
  const skillsLines = doc.splitTextToSize(skillsText, contentWidth);
  doc.text(skillsLines, margin, yPos);
  yPos += (skillsLines.length * lineHeight) + 5;
  
  // Languages section
  if (yPos > doc.internal.pageSize.height - 30) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFont(titleFont, "bold");
  doc.setFontSize(subtitleFontSize);
  doc.text("Languages", margin, yPos);
  yPos += lineHeight;
  
  doc.setFont(bodyFont, "normal");
  doc.setFontSize(bodyFontSize);
  
  const languagesText = data.languages.map(lang => 
    `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
  ).join(", ");
  
  const languagesLines = doc.splitTextToSize(languagesText, contentWidth);
  doc.text(languagesLines, margin, yPos);
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
