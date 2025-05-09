import jsPDF from 'jspdf';
import { CompleteCV } from '@shared/types';

/**
 * Configuration for PDF generation
 */
const PDF_CONFIG = {
  // PDF format configuration
  format: {
    unit: 'mm' as const,
    format: 'a4' as const, // A4 format
    orientation: 'portrait' as const,
  },
  // Margins
  margins: {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  },
  // Font settings
  font: {
    family: 'helvetica',
    style: 'normal',
    size: 10
  }
};

/**
 * Generates a PDF directly from the CV data
 * @param element The HTML element containing the reference CV (for styling cues only)
 * @param data The CV data 
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV
): Promise<void> {
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
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: PDF_CONFIG.format.orientation,
      unit: PDF_CONFIG.format.unit,
      format: PDF_CONFIG.format.format,
    });
    
    // Set default font
    pdf.setFont(PDF_CONFIG.font.family, PDF_CONFIG.font.style);
    pdf.setFontSize(PDF_CONFIG.font.size);
    
    // Page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = PDF_CONFIG.margins;
    const contentWidth = pageWidth - margin.left - margin.right;
    
    // Current Y position tracker
    let y = margin.top;
    
    // Helper function to add a section title
    const addSectionTitle = (title: string, yPos: number): number => {
      pdf.setFont(PDF_CONFIG.font.family, 'bold');
      pdf.setFontSize(12);
      pdf.text(title, margin.left, yPos);
      
      // Add a line under the title
      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin.left, yPos, pageWidth - margin.right, yPos);
      
      // Return the new Y position
      return yPos + 5;
    };
    
    // Helper function to add text with line wrapping
    const addWrappedText = (text: string, x: number, yPos: number, maxWidth: number): number => {
      pdf.setFont(PDF_CONFIG.font.family, 'normal');
      pdf.setFontSize(10);
      
      // Split text to multiline and get updated Y position
      const splitText = pdf.splitTextToSize(text, maxWidth);
      pdf.text(splitText, x, yPos);
      
      // Return the new Y position (plus some padding)
      return yPos + (splitText.length * 5);
    };
    
    // Format date helper
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
    
    // Add bullet point helper
    const addBulletPoint = (text: string, x: number, yPos: number, maxWidth: number): number => {
      // Add bullet
      pdf.text("•", x, yPos);
      
      // Add indented text
      return addWrappedText(text, x + 5, yPos, maxWidth - 5);
    };
    
    // Check for page break
    const checkPageBreak = (yPos: number, requiredHeight: number): number => {
      if (yPos + requiredHeight > pageHeight - margin.bottom) {
        pdf.addPage();
        return margin.top;
      }
      return yPos;
    };
    
    // PERSONAL INFO SECTION
    // Name
    pdf.setFont(PDF_CONFIG.font.family, 'bold');
    pdf.setFontSize(18);
    pdf.text(`${data.personal.firstName} ${data.personal.lastName}`, margin.left, y);
    y += 10;
    
    // Contact info
    pdf.setFont(PDF_CONFIG.font.family, 'normal');
    pdf.setFontSize(10);
    
    const contactInfo = [];
    if (data.personal.email) contactInfo.push(data.personal.email);
    if (data.personal.phone) contactInfo.push(data.personal.phone);
    if (data.personal.linkedin) contactInfo.push(data.personal.linkedin);
    
    pdf.text(contactInfo.join(' | '), margin.left, y);
    y += 15;
    
    // PROFESSIONAL SUMMARY
    if (data.professional?.summary) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Professional Summary', y);
      y = addWrappedText(data.professional.summary, margin.left, y, contentWidth);
      y += 10;
    }
    
    // KEY COMPETENCIES
    if (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Key Competencies', y);
      
      if (data.keyCompetencies?.technicalSkills?.length) {
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text('Technical Skills:', margin.left, y);
        y += 5;
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        y = addWrappedText(
          data.keyCompetencies.technicalSkills.join(', '), 
          margin.left, 
          y, 
          contentWidth
        );
        y += 5;
      }
      
      if (data.keyCompetencies?.softSkills?.length) {
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text('Soft Skills:', margin.left, y);
        y += 5;
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        y = addWrappedText(
          data.keyCompetencies.softSkills.join(', '), 
          margin.left, 
          y, 
          contentWidth
        );
      }
      
      y += 10;
    }
    
    // EXPERIENCE SECTION
    if (data.experience?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Professional Experience', y);
      
      data.experience.forEach((exp) => {
        y = checkPageBreak(y, 30);
        
        // Job title
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text(exp.jobTitle, margin.left, y);
        
        // Date on the right
        const dateText = `${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`;
        const dateTextWidth = pdf.getTextWidth(dateText);
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        pdf.text(dateText, pageWidth - margin.right - dateTextWidth, y);
        y += 5;
        
        // Company name
        pdf.text(exp.companyName, margin.left, y);
        y += 7;
        
        // Responsibilities
        if (exp.responsibilities) {
          const lines = exp.responsibilities.split('\n');
          lines.forEach(line => {
            if (!line.trim()) return;
            
            y = checkPageBreak(y, 15);
            
            // If line starts with bullet point
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              const cleanLine = line.trim().substring(1).trim();
              y = addBulletPoint(cleanLine, margin.left + 5, y, contentWidth - 5);
            } else {
              y = addWrappedText(line, margin.left, y, contentWidth);
            }
          });
        }
        
        y += 10;
      });
    }
    
    // EDUCATION SECTION
    if (data.education?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Education', y);
      
      data.education.forEach((edu) => {
        y = checkPageBreak(y, 30);
        
        // Degree
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text(edu.major, margin.left, y);
        
        // Date on the right
        const dateText = `${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`;
        const dateTextWidth = pdf.getTextWidth(dateText);
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        pdf.text(dateText, pageWidth - margin.right - dateTextWidth, y);
        y += 5;
        
        // School name
        pdf.text(edu.schoolName, margin.left, y);
        y += 7;
        
        // Achievements
        if (edu.achievements) {
          const lines = edu.achievements.split('\n');
          lines.forEach(line => {
            if (!line.trim()) return;
            
            y = checkPageBreak(y, 15);
            
            // If line starts with bullet point
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              const cleanLine = line.trim().substring(1).trim();
              y = addBulletPoint(cleanLine, margin.left + 5, y, contentWidth - 5);
            } else {
              y = addWrappedText(line, margin.left, y, contentWidth);
            }
          });
        }
        
        y += 10;
      });
    }
    
    // CERTIFICATES SECTION
    if (data.certificates?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Certifications', y);
      
      data.certificates.forEach((cert) => {
        y = checkPageBreak(y, 30);
        
        // Certificate name
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text(cert.name, margin.left, y);
        
        // Date on the right
        const dateText = formatDate(cert.dateAcquired);
        const dateTextWidth = pdf.getTextWidth(dateText);
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        pdf.text(dateText, pageWidth - margin.right - dateTextWidth, y);
        y += 5;
        
        // Institution
        pdf.text(cert.institution, margin.left, y);
        y += 7;
        
        // Achievements
        if (cert.achievements) {
          const lines = cert.achievements.split('\n');
          lines.forEach(line => {
            if (!line.trim()) return;
            
            y = checkPageBreak(y, 15);
            
            // If line starts with bullet point
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              const cleanLine = line.trim().substring(1).trim();
              y = addBulletPoint(cleanLine, margin.left + 5, y, contentWidth - 5);
            } else {
              y = addWrappedText(line, margin.left, y, contentWidth);
            }
          });
        }
        
        y += 10;
      });
    }
    
    // EXTRACURRICULAR SECTION
    if (data.extracurricular?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Extracurricular Activities', y);
      
      data.extracurricular.forEach((extra) => {
        y = checkPageBreak(y, 30);
        
        // Role
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text(extra.role, margin.left, y);
        
        // Date on the right
        const dateText = `${formatDate(extra.startDate)} - ${extra.isCurrent ? 'Present' : formatDate(extra.endDate)}`;
        const dateTextWidth = pdf.getTextWidth(dateText);
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        pdf.text(dateText, pageWidth - margin.right - dateTextWidth, y);
        y += 5;
        
        // Organization
        pdf.text(extra.organization, margin.left, y);
        y += 7;
        
        // Description
        if (extra.description) {
          const lines = extra.description.split('\n');
          lines.forEach(line => {
            if (!line.trim()) return;
            
            y = checkPageBreak(y, 15);
            
            // If line starts with bullet point
            if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
              const cleanLine = line.trim().substring(1).trim();
              y = addBulletPoint(cleanLine, margin.left + 5, y, contentWidth - 5);
            } else {
              y = addWrappedText(line, margin.left, y, contentWidth);
            }
          });
        }
        
        y += 10;
      });
    }
    
    // LANGUAGES SECTION (if applicable)
    if (data.languages?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Languages', y);
      
      data.languages.forEach((lang) => {
        y = checkPageBreak(y, 15);
        
        pdf.setFont(PDF_CONFIG.font.family, 'bold');
        pdf.text(lang.name, margin.left, y);
        
        pdf.setFont(PDF_CONFIG.font.family, 'normal');
        pdf.text(`- ${lang.proficiency}`, margin.left + 40, y);
        
        y += 7;
      });
    }
    
    // ADDITIONAL SKILLS (if applicable)
    if (data.additional?.skills?.length) {
      y = checkPageBreak(y, 40);
      y = addSectionTitle('Additional Skills', y);
      
      y = addWrappedText(
        data.additional.skills.join(', '), 
        margin.left, 
        y, 
        contentWidth
      );
      
      y += 10;
    }
    
    // Generate the filename from user data
    const firstName = data.personal.firstName || 'CV';
    const lastName = data.personal.lastName || '';
    const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
    
    // Download the PDF
    pdf.save(filename);
    
    // Remove loading indicator
    document.body.removeChild(loadingEl);
    
  } catch (error) {
    // Remove loading indicator in case of error
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    // Handle error
    console.error('Error generating PDF:', error);
    
    // Show error message
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error generating PDF';
    
    alert(`Failed to generate PDF: ${errorMessage}`);
  }
}