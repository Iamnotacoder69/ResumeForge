import { jsPDF } from 'jspdf';
import { CompleteCV, TemplateType } from '@shared/types';
import { formatDate } from './date-utils';

/**
 * Configuration for direct PDF generation
 */
const PDF_CONFIG = {
  // PDF format configuration
  format: {
    unit: 'mm' as const,
    format: 'a4' as const, // A4 format
    orientation: 'portrait' as const,
  },
  // Typography settings
  typography: {
    fontName: 'helvetica',
    fontSize: {
      name: 24, 
      sectionTitle: 14,
      subHeading: 12,
      normal: 10,
      small: 9
    },
    lineHeight: 1.3
  },
  // Colors in RGB format
  colors: {
    primary: [30, 80, 225] as [number, number, number], // Blue for modern template
    dark: [50, 50, 50] as [number, number, number],     // For dark text
    medium: [90, 90, 90] as [number, number, number],   // For regular text
    light: [120, 120, 120] as [number, number, number]  // For supplementary text
  },
  // Margins in mm
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  }
};

/**
 * Directly generates a PDF document from the CV data without using HTML/Canvas
 * This ensures text remains selectable and the output is more consistent
 */
export async function generatePDF(data: CompleteCV): Promise<void> {
  try {
    // Show a loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.className = 
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingEl.innerHTML = `
      <div class="bg-white p-4 rounded-md shadow-xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
          <p class="text-lg font-medium">Generating PDF...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loadingEl);

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: PDF_CONFIG.format.orientation,
      unit: PDF_CONFIG.format.unit,
      format: PDF_CONFIG.format.format,
    });

    // Add custom font for better international character support
    doc.setFont(PDF_CONFIG.typography.fontName);

    try {
      const templateType = data.templateSettings?.template || 'professional';
      
      // Type guard for template type
      if (templateType === 'modern') {
        await renderModernTemplate(doc, data);
      } else if (templateType === 'minimal') {
        await renderMinimalTemplate(doc, data);
      } else {
        // Default to professional template
        await renderProfessionalTemplate(doc, data);
      }

      // Generate filename from user data
      const firstName = data.personal.firstName || 'CV';
      const lastName = data.personal.lastName || '';
      const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\\s+/g, '_');
      
      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error in template rendering:', error);
      throw error;
    }

    // Remove loading indicator
    document.body.removeChild(loadingEl);
  } catch (error) {
    // Remove loading indicator if there was an error
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Professional template - Clean, classic design with horizontal rules
 */
async function renderProfessionalTemplate(doc: jsPDF, data: CompleteCV): Promise<void> {
  const margins = PDF_CONFIG.margins;
  const pageWidth = doc.internal.pageSize.width;
  
  let y = margins.top; // Current Y position
  
  // Helper functions for this template
  const addSectionTitle = (title: string) => {
    doc.setFontSize(PDF_CONFIG.typography.fontSize.sectionTitle);
    doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
    doc.setTextColor(PDF_CONFIG.colors.primary[0], PDF_CONFIG.colors.primary[1], PDF_CONFIG.colors.primary[2]);
    doc.text(title, margins.left, y);
    
    // Add a horizontal line
    y += 4;
    doc.setDrawColor(PDF_CONFIG.colors.primary[0], PDF_CONFIG.colors.primary[1], PDF_CONFIG.colors.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margins.left, y, pageWidth - margins.right, y);
    
    y += 5; // Space after the title
  };
  
  const addText = (text: string, options: { fontSize?: number, isEmphasized?: boolean } = {}) => {
    const { fontSize = PDF_CONFIG.typography.fontSize.normal, isEmphasized = false } = options;
    
    doc.setFontSize(fontSize);
    doc.setFont(PDF_CONFIG.typography.fontName, isEmphasized ? 'bold' : 'normal');
    doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
    
    const splitText = doc.splitTextToSize(text, pageWidth - margins.left - margins.right);
    doc.text(splitText, margins.left, y);
    
    // Calculate height of text
    const textHeight = splitText.length * fontSize * 0.3527; // Convert pt to mm
    
    y += textHeight + 4; // Add spacing after text
  };
  
  const addBulletPoints = (points: string[]) => {
    doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
    doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
    doc.setTextColor(PDF_CONFIG.colors.medium[0], PDF_CONFIG.colors.medium[1], PDF_CONFIG.colors.medium[2]);
    
    points.forEach(point => {
      if (!point.trim()) return;
      
      // Add bullet
      doc.text('•', margins.left, y);
      
      // Add text with indent
      const bulletIndent = 5;
      const splitText = doc.splitTextToSize(point.trim(), pageWidth - margins.left - margins.right - bulletIndent);
      doc.text(splitText, margins.left + bulletIndent, y);
      
      // Calculate height of bullet point
      const textHeight = splitText.length * PDF_CONFIG.typography.fontSize.normal * 0.3527;
      y += textHeight + 3;
    });
  };

  // Check for page break
  const checkPageBreak = (requiredHeight: number) => {
    if (y + requiredHeight > doc.internal.pageSize.height - margins.bottom) {
      doc.addPage();
      y = margins.top;
    }
  };
  
  // 1. HEADER: Name and contact information
  doc.setFontSize(PDF_CONFIG.typography.fontSize.name);
  doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
  doc.setTextColor(255, 255, 255); // White color
  
  // Blue header background
  doc.setFillColor(30, 80, 225);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // Name
  doc.text(`${data.personal.firstName} ${data.personal.lastName}`, margins.left, 20);
  
  // Contact info
  doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
  doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
  
  let contactInfo = '';
  if (data.personal.email) contactInfo += data.personal.email;
  if (data.personal.phone) {
    contactInfo += contactInfo ? '   ' : '';
    contactInfo += data.personal.phone;
  }
  
  doc.text(contactInfo, margins.left, 28);
  
  // Adjust Y position after header
  y = 40;
  
  // Photo (if included)
  if (data.templateSettings?.includePhoto && data.personal.photoUrl) {
    try {
      // Extract base64 data
      const photoUrl = data.personal.photoUrl;
      if (photoUrl.startsWith('data:image/')) {
        const base64Data = photoUrl.split(',')[1];
        if (base64Data) {
          // Add image to right side
          const photoX = pageWidth - margins.right - 30; // 30mm width
          const photoY = 40;
          doc.addImage(base64Data, 'JPEG', photoX, photoY, 30, 35);
        }
      }
    } catch (err) {
      console.error("Error adding photo:", err);
    }
  }
  
  // Get visible sections and sort by order
  const visibleSections = data.templateSettings?.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];
  
  // Iterate through sections
  for (const section of visibleSections) {
    // Check for page break
    checkPageBreak(40);
    
    switch (section.id) {
      case 'summary':
        if (data.professional?.summary) {
          addSectionTitle('Professional Summary');
          addText(data.professional.summary);
        }
        break;
        
      case 'keyCompetencies':
        if (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) {
          addSectionTitle('Key Competencies');
          
          if (data.keyCompetencies.technicalSkills?.length) {
            // Add Technical Skills header
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text('Technical Skills', margins.left, y);
            y += 5;
            
            // Add skill pills
            doc.setFillColor(240, 240, 240);
            doc.setDrawColor(210, 210, 210);
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            
            let xPos = margins.left;
            const skillPadding = 4;
            const skillMargin = 5;
            
            data.keyCompetencies.technicalSkills.forEach(skill => {
              const textWidth = doc.getTextWidth(skill);
              const skillWidth = textWidth + (skillPadding * 2);
              
              // Check if we need to move to next line
              if (xPos + skillWidth > pageWidth - margins.right) {
                xPos = margins.left;
                y += 10;
              }
              
              // Draw pill background
              doc.roundedRect(xPos, y - 3, skillWidth, 8, 2, 2, 'F');
              
              // Draw skill text
              doc.text(skill, xPos + skillPadding, y);
              
              // Update x position for next skill
              xPos += skillWidth + skillMargin;
            });
            
            // Move y position after skills section
            y += 12;
          }
          
          if (data.keyCompetencies.softSkills?.length) {
            // Add Soft Skills header
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text('Soft Skills', margins.left, y);
            y += 5;
            
            // Add skill pills
            doc.setFillColor(240, 240, 240);
            doc.setDrawColor(210, 210, 210);
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            
            let xPos = margins.left;
            const skillPadding = 4;
            const skillMargin = 5;
            
            data.keyCompetencies.softSkills.forEach(skill => {
              const textWidth = doc.getTextWidth(skill);
              const skillWidth = textWidth + (skillPadding * 2);
              
              // Check if we need to move to next line
              if (xPos + skillWidth > pageWidth - margins.right) {
                xPos = margins.left;
                y += 10;
              }
              
              // Draw pill background
              doc.roundedRect(xPos, y - 3, skillWidth, 8, 2, 2, 'F');
              
              // Draw skill text
              doc.text(skill, xPos + skillPadding, y);
              
              // Update x position for next skill
              xPos += skillWidth + skillMargin;
            });
            
            // Move y position after skills section
            y += 12;
          }
        }
        break;
        
      case 'experience':
        if (data.experience?.length) {
          addSectionTitle('Professional Experience');
          
          data.experience.forEach((exp, index) => {
            checkPageBreak(30);
            
            // Position and company with dates on right
            const positionText = exp.jobTitle;
            const datesText = `${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`;
            
            // Job title (bold)
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text(positionText, margins.left, y);
            
            // Calculate text width for right alignment
            const datesWidth = doc.getTextWidth(datesText);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.light[0], PDF_CONFIG.colors.light[1], PDF_CONFIG.colors.light[2]);
            doc.text(datesText, pageWidth - margins.right - datesWidth, y);
            
            y += 5;
            
            // Company name
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.medium[0], PDF_CONFIG.colors.medium[1], PDF_CONFIG.colors.medium[2]);
            doc.text(exp.companyName, margins.left, y);
            
            y += 5;
            
            // Responsibilities
            if (exp.responsibilities) {
              const responsibilities = exp.responsibilities.split('\\n').filter(r => r.trim());
              
              // Get clean bullet points from text
              const bulletPoints = responsibilities.map(r => {
                return r.trim().startsWith('-') || r.trim().startsWith('•') 
                  ? r.trim().substring(1).trim() 
                  : r.trim();
              });
              
              addBulletPoints(bulletPoints);
            }
            
            // Add space between experiences
            if (index < data.experience.length - 1) {
              y += 5;
            }
          });
        }
        break;
        
      case 'education':
        if (data.education?.length) {
          addSectionTitle('Education');
          
          data.education.forEach((edu, index) => {
            checkPageBreak(30);
            
            // Degree with dates on right
            const degreeText = edu.major;
            const datesText = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
            
            // Degree (bold)
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text(degreeText, margins.left, y);
            
            // Calculate text width for right alignment
            const datesWidth = doc.getTextWidth(datesText);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.light[0], PDF_CONFIG.colors.light[1], PDF_CONFIG.colors.light[2]);
            doc.text(datesText, pageWidth - margins.right - datesWidth, y);
            
            y += 5;
            
            // School name
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.medium[0], PDF_CONFIG.colors.medium[1], PDF_CONFIG.colors.medium[2]);
            doc.text(edu.schoolName, margins.left, y);
            
            y += 5;
            
            // Achievements
            if (edu.achievements) {
              const achievements = edu.achievements.split('\\n').filter(a => a.trim());
              
              // Get clean bullet points from text
              const bulletPoints = achievements.map(a => {
                return a.trim().startsWith('-') || a.trim().startsWith('•') 
                  ? a.trim().substring(1).trim() 
                  : a.trim();
              });
              
              addBulletPoints(bulletPoints);
            }
            
            // Add space between education entries
            if (index < data.education.length - 1) {
              y += 5;
            }
          });
        }
        break;
        
      case 'certificates':
        if (data.certificates?.length) {
          addSectionTitle('Certifications');
          
          data.certificates.forEach((cert, index) => {
            checkPageBreak(25);
            
            // Certificate with date
            const certNameText = cert.name;
            const dateText = formatDate(cert.dateAcquired);
            
            // Certificate name (bold)
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text(certNameText, margins.left, y);
            
            // Calculate text width for right alignment
            const dateWidth = doc.getTextWidth(dateText);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.light[0], PDF_CONFIG.colors.light[1], PDF_CONFIG.colors.light[2]);
            doc.text(dateText, pageWidth - margins.right - dateWidth, y);
            
            y += 5;
            
            // Institution
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.medium[0], PDF_CONFIG.colors.medium[1], PDF_CONFIG.colors.medium[2]);
            doc.text(cert.institution, margins.left, y);
            
            y += 5;
            
            // Achievements
            if (cert.achievements) {
              const achievements = cert.achievements.split('\\n').filter(a => a.trim());
              
              // Get clean bullet points from text
              const bulletPoints = achievements.map(a => {
                return a.trim().startsWith('-') || a.trim().startsWith('•') 
                  ? a.trim().substring(1).trim() 
                  : a.trim();
              });
              
              addBulletPoints(bulletPoints);
            }
            
            // Add space between certificates
            if (index < data.certificates.length - 1) {
              y += 5;
            }
          });
        }
        break;
      
      case 'extracurricular':
        if (data.extracurricular?.length) {
          addSectionTitle('Extracurricular Activities');
          
          data.extracurricular.forEach((extra, index) => {
            checkPageBreak(30);
            
            // Role with dates
            const roleText = extra.role;
            const datesText = `${formatDate(extra.startDate)} - ${extra.isCurrent ? 'Present' : formatDate(extra.endDate)}`;
            
            // Role (bold)
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text(roleText, margins.left, y);
            
            // Calculate text width for right alignment
            const datesWidth = doc.getTextWidth(datesText);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.light[0], PDF_CONFIG.colors.light[1], PDF_CONFIG.colors.light[2]);
            doc.text(datesText, pageWidth - margins.right - datesWidth, y);
            
            y += 5;
            
            // Organization name
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            doc.setTextColor(PDF_CONFIG.colors.medium[0], PDF_CONFIG.colors.medium[1], PDF_CONFIG.colors.medium[2]);
            doc.text(extra.organization, margins.left, y);
            
            y += 5;
            
            // Description
            if (extra.description) {
              const descriptions = extra.description.split('\\n').filter(d => d.trim());
              
              // Get clean bullet points from text
              const bulletPoints = descriptions.map(d => {
                return d.trim().startsWith('-') || d.trim().startsWith('•') 
                  ? d.trim().substring(1).trim() 
                  : d.trim();
              });
              
              addBulletPoints(bulletPoints);
            }
            
            // Add space between entries
            if (index < data.extracurricular.length - 1) {
              y += 5;
            }
          });
        }
        break;
      
      case 'additional':
        const hasLanguages = data.languages?.length > 0;
        const hasAdditionalSkills = data.additional?.skills?.length > 0;
        
        if (hasLanguages || hasAdditionalSkills) {
          addSectionTitle('Additional Information');
          
          if (hasLanguages) {
            // Languages
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text('Languages', margins.left, y);
            
            y += 5;
            
            data.languages.forEach((lang, index) => {
              doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
              doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
              doc.setTextColor(PDF_CONFIG.colors.medium[0], PDF_CONFIG.colors.medium[1], PDF_CONFIG.colors.medium[2]);
              
              const langText = `${lang.name} (${lang.proficiency})`;
              doc.text(langText, margins.left, y);
              
              y += 5;
            });
            
            y += 5;
          }
          
          if (hasAdditionalSkills) {
            // Additional skills
            doc.setFontSize(PDF_CONFIG.typography.fontSize.subHeading);
            doc.setFont(PDF_CONFIG.typography.fontName, 'bold');
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.text('Additional Skills', margins.left, y);
            
            y += 5;
            
            // Add skill pills
            doc.setFillColor(240, 240, 240);
            doc.setDrawColor(210, 210, 210);
            doc.setTextColor(PDF_CONFIG.colors.dark[0], PDF_CONFIG.colors.dark[1], PDF_CONFIG.colors.dark[2]);
            doc.setFontSize(PDF_CONFIG.typography.fontSize.normal);
            doc.setFont(PDF_CONFIG.typography.fontName, 'normal');
            
            let xPos = margins.left;
            const skillPadding = 4;
            const skillMargin = 5;
            
            data.additional.skills.forEach(skill => {
              const textWidth = doc.getTextWidth(skill);
              const skillWidth = textWidth + (skillPadding * 2);
              
              // Check if we need to move to next line
              if (xPos + skillWidth > pageWidth - margins.right) {
                xPos = margins.left;
                y += 10;
              }
              
              // Draw pill background
              doc.roundedRect(xPos, y - 3, skillWidth, 8, 2, 2, 'F');
              
              // Draw skill text
              doc.text(skill, xPos + skillPadding, y);
              
              // Update x position for next skill
              xPos += skillWidth + skillMargin;
            });
            
            y += 12;
          }
        }
        break;
    }
  }
}

/**
 * Modern template implementation
 */
async function renderModernTemplate(doc: jsPDF, data: CompleteCV): Promise<void> {
  // Modern template uses similar approach but with different styling
  // Implement based on professional template with modern design elements
  // This is a simplified placeholder - expand as needed
  await renderProfessionalTemplate(doc, data);
}

/**
 * Minimal template implementation
 */
async function renderMinimalTemplate(doc: jsPDF, data: CompleteCV): Promise<void> {
  // Minimal template uses similar approach but with different styling
  // Implement based on professional template with minimal design elements
  // This is a simplified placeholder - expand as needed
  await renderProfessionalTemplate(doc, data);
}