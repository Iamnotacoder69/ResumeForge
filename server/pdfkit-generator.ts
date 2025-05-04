import PDFDocument from 'pdfkit';
import { CompleteCV, TemplateType, SectionOrder } from '@shared/types';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utility function to format dates consistently
 * @param dateString Date string to format
 * @returns Formatted date as "Month Year"
 */
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
}

/**
 * Capitalizes the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
function capitalize(str: string): string {
  if (typeof str !== 'string' || !str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper to prepare image for PDF
 * @param photoUrl URL or data URI of photo
 * @returns Buffer with image data
 */
function prepareImage(photoUrl: string): Buffer | null {
  if (!photoUrl) return null;
  
  try {
    if (photoUrl.startsWith('data:image/')) {
      // Handle base64 image
      const matches = photoUrl.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        return Buffer.from(matches[2], 'base64');
      }
    } else if (photoUrl.startsWith('http')) {
      // Remote URLs not supported directly, would need to fetch
      console.log('Remote image URLs not supported, skipping photo');
    } else if (fs.existsSync(photoUrl)) {
      // Load local file
      return fs.readFileSync(photoUrl);
    }
  } catch (e) {
    console.error('Error processing image:', e);
  }
  
  return null;
}

/**
 * Generates a PDF document from CV data using PDFKit
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const templateType = data.templateSettings?.template || 'professional';
      const includePhoto = data.templateSettings?.includePhoto || false;
      
      // Use user-defined section order or default
      const defaultSectionOrder: SectionOrder[] = [
        { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
        { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
        { id: 'experience', name: 'Work Experience', visible: true, order: 2 },
        { id: 'education', name: 'Education', visible: true, order: 3 },
        { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
        { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
        { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
      ];
      
      const sectionOrder = data.templateSettings?.sectionOrder?.filter(section => section.visible) || defaultSectionOrder;
      
      console.log(`PDF Generation - Template: ${templateType}`);
      console.log(`PDF Generation - Has Key Competencies: ${!!data.keyCompetencies}`);
      console.log(`PDF Generation - Has Extracurricular: ${!!data.extracurricular && data.extracurricular.length > 0}`);
      console.log(`PDF Generation - Sections:`, sectionOrder.map(s => s.id));
      console.log(`PDF Generation - Include Photo: ${includePhoto}`);
      
      // Create a PDF document
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 0,
        bufferPages: true,  // Enable buffer pages for page numbers
        autoFirstPage: true,
        info: {
          Title: `CV - ${data.personal.firstName} ${data.personal.lastName}`,
          Author: `${data.personal.firstName} ${data.personal.lastName}`,
          Subject: 'Professional CV',
          Keywords: 'cv, resume, professional'
        }
      });
      
      // Set up document styling based on template
      const templateStyles: Record<string, {
        titleFont: string;
        bodyFont: string;
        titleColor: string;
        textColor: string;
        accentColor: string;
        backgroundColor: string;
      }> = {
        'professional': {
          titleFont: 'Helvetica-Bold',
          bodyFont: 'Helvetica',
          titleColor: '#304878',
          textColor: '#333333',
          accentColor: '#dddddd',
          backgroundColor: '#ffffff'
        },
        'modern-sidebar': {
          titleFont: 'Helvetica-Bold',
          bodyFont: 'Helvetica',
          titleColor: '#333333',
          textColor: '#333333',
          accentColor: '#f0c869',
          backgroundColor: '#ffffff'
        },
        'creative': {
          titleFont: 'Helvetica-Bold',
          bodyFont: 'Helvetica',
          titleColor: '#3498db',
          textColor: '#2c3e50',
          accentColor: '#3498db',
          backgroundColor: '#ffffff'
        },
        'academic': {
          titleFont: 'Times-Bold',
          bodyFont: 'Times-Roman',
          titleColor: '#000000',
          textColor: '#333333',
          accentColor: '#000000',
          backgroundColor: '#ffffff'
        },
        'minimalist': {
          titleFont: 'Helvetica-Bold',
          bodyFont: 'Helvetica',
          titleColor: '#304878',
          textColor: '#333333',
          accentColor: '#dddddd',
          backgroundColor: '#ffffff'
        }
      };
      
      // Use minimalist as professional if selected
      const style = templateStyles[templateType === 'minimalist' ? 'professional' : templateType];
      
      // Convert mm to points (1mm ≈ 2.83465pt)
      const mmToPt = 2.83465;
      const marginMm = 20; 
      const margin = marginMm * mmToPt; // Convert to points for PDFKit
      const contentWidth = doc.page.width - (margin * 2);
      
      // Buffers to collect PDF content
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log(`PDF Generation - PDF buffer created, size: ${pdfBuffer.length}`);
        resolve(pdfBuffer);
      });
      
      // Apply template-specific styling and layout
      if (templateType && templateType === 'modern-sidebar') {
        // Modern sidebar layout
        const sidebarWidth = 60; // 60mm -> ~170pt
        const mainContentX = sidebarWidth + margin;
        const mainContentWidth = doc.page.width - mainContentX - margin;
        
        // Draw sidebar background
        doc.rect(0, 0, sidebarWidth + margin, doc.page.height)
           .fill(style.accentColor);
        
        // Profile photo (in sidebar)
        let currentY = margin;
        if (includePhoto && data.personal.photoUrl) {
          const photoImage = prepareImage(data.personal.photoUrl);
          if (photoImage) {
            const photoSize = 40; // 40mm -> ~113pt
            doc.circle(sidebarWidth / 2, currentY + photoSize / 2, photoSize / 2)
              .clip();
            doc.image(photoImage, (sidebarWidth - photoSize) / 2, currentY, {
              width: photoSize,
              height: photoSize
            });
            doc.save();
            currentY += photoSize + 5; // 5mm spacing
          }
        }
        
        // Name
        doc.font(style.titleFont)
           .fontSize(14)
           .fill(style.textColor)
           .text(`${data.personal.firstName} ${data.personal.lastName}`, 
                 margin, currentY, { width: sidebarWidth - margin });
        currentY += 7;
        
        // Contact section
        doc.font(style.titleFont)
           .fontSize(10)
           .text('CONTACT', margin, currentY, { width: sidebarWidth - margin });
        currentY += 5;
        
        doc.font(style.bodyFont)
           .fontSize(10)
           .text(`Email: ${data.personal.email}`, margin, currentY, { width: sidebarWidth - margin });
        currentY += 4;
        
        doc.text(`Phone: ${data.personal.phone}`, margin, currentY, { width: sidebarWidth - margin });
        currentY += 4;
        
        if (data.personal.linkedin) {
          doc.text(`LinkedIn: linkedin.com/in/${data.personal.linkedin}`, margin, currentY, { width: sidebarWidth - margin });
          currentY += 4;
        }
        
        currentY += 7;
        
        // Languages section
        if (data.languages && data.languages.length > 0) {
          doc.font(style.titleFont)
             .fontSize(10)
             .text('LANGUAGES', margin, currentY, { width: sidebarWidth - margin });
          currentY += 5;
          
          doc.font(style.bodyFont).fontSize(10);
          for (const language of data.languages) {
            doc.text(`${language.name} (${capitalize(language.proficiency)})`, 
                    margin, currentY, { width: sidebarWidth - margin });
            currentY += 4;
          }
          
          currentY += 7;
        }
        
        // Computer skills section
        if (data.additional?.skills?.length > 0) {
          doc.font(style.titleFont)
             .fontSize(10)
             .text('COMPUTER SKILLS', margin, currentY, { width: sidebarWidth - margin });
          currentY += 5;
          
          doc.font(style.bodyFont)
             .fontSize(10)
             .text(data.additional.skills.join(', '), 
                   margin, currentY, { width: sidebarWidth - margin });
        }
        
        // Main content sections
        let mainY = margin;
        
        // Render ordered sections
        for (const section of sectionOrder) {
          // Add sections to main content area
          if (section.id === 'summary' && data.professional?.summary) {
            // Summary section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('PROFESSIONAL SUMMARY', mainContentX, mainY, { width: mainContentWidth });
            mainY += 8;
            
            doc.font(style.bodyFont)
               .fontSize(11)
               .fill(style.textColor)
               .text(data.professional.summary, mainContentX, mainY, { width: mainContentWidth });
            mainY += 15; // 7mm section spacing
          }
          else if (section.id === 'keyCompetencies' && data.keyCompetencies) {
            // Key Competencies section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('KEY COMPETENCIES', mainContentX, mainY, { width: mainContentWidth });
            mainY += 8;
            
            if (data.keyCompetencies.technicalSkills && data.keyCompetencies.technicalSkills.length > 0) {
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text('Technical Skills', mainContentX, mainY, { width: mainContentWidth });
              mainY += 5;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .text(data.keyCompetencies.technicalSkills.join(', '), 
                       mainContentX, mainY, { width: mainContentWidth });
              mainY += 7;
            }
            
            if (data.keyCompetencies.softSkills && data.keyCompetencies.softSkills.length > 0) {
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text('Soft Skills', mainContentX, mainY, { width: mainContentWidth });
              mainY += 5;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .text(data.keyCompetencies.softSkills.join(', '), 
                       mainContentX, mainY, { width: mainContentWidth });
              mainY += 7;
            }
            
            mainY += 8; // Additional spacing after section
          }
          else if (section.id === 'experience' && data.experience && data.experience.length > 0) {
            // Experience section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('WORK EXPERIENCE', mainContentX, mainY, { width: mainContentWidth });
            mainY += 8;
            
            for (let i = 0; i < data.experience.length; i++) {
              const exp = data.experience[i];
              
              // Draw accent dot
              doc.circle(mainContentX + 4, mainY + 4, 4)
                 .fill(style.accentColor);
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(exp.jobTitle, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
              mainY += 5;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${exp.companyName} | ${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`, 
                       mainContentX + 10, mainY, { width: mainContentWidth - 10, oblique: true });
              mainY += 5;
              
              if (exp.responsibilities) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(exp.responsibilities, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
                const textHeight = doc.heightOfString(exp.responsibilities, { width: mainContentWidth - 10 });
                mainY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.experience.length - 1) {
                mainY += 10; // 5mm entry spacing
              }
            }
            
            mainY += 15; // 7mm section spacing
          }
          else if (section.id === 'education' && data.education && data.education.length > 0) {
            // Education section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('EDUCATION', mainContentX, mainY, { width: mainContentWidth });
            mainY += 8;
            
            for (let i = 0; i < data.education.length; i++) {
              const edu = data.education[i];
              
              // Draw accent dot
              doc.circle(mainContentX + 4, mainY + 4, 4)
                 .fill(style.accentColor);
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(edu.major, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
              mainY += 5;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${edu.schoolName} | ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`, 
                       mainContentX + 10, mainY, { width: mainContentWidth - 10, oblique: true });
              mainY += 5;
              
              if (edu.achievements) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(edu.achievements, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
                const textHeight = doc.heightOfString(edu.achievements, { width: mainContentWidth - 10 });
                mainY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.education.length - 1) {
                mainY += 10; // 5mm entry spacing
              }
            }
            
            mainY += 15; // 7mm section spacing
          }
          else if (section.id === 'certificates' && data.certificates && data.certificates.length > 0) {
            // Certificates section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('CERTIFICATES', mainContentX, mainY, { width: mainContentWidth });
            mainY += 8;
            
            for (let i = 0; i < data.certificates.length; i++) {
              const cert = data.certificates[i];
              
              // Draw accent dot
              doc.circle(mainContentX + 4, mainY + 4, 4)
                 .fill(style.accentColor);
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(cert.name, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
              mainY += 5;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${cert.institution} | ${formatDate(cert.dateAcquired)}${cert.expirationDate ? ` (Expires: ${formatDate(cert.expirationDate)})` : ''}`, 
                       mainContentX + 10, mainY, { width: mainContentWidth - 10, oblique: true });
              mainY += 5;
              
              if (cert.achievements) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(cert.achievements, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
                const textHeight = doc.heightOfString(cert.achievements, { width: mainContentWidth - 10 });
                mainY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.certificates.length - 1) {
                mainY += 10; // 5mm entry spacing
              }
            }
            
            mainY += 15; // 7mm section spacing
          }
          else if (section.id === 'extracurricular' && data.extracurricular && data.extracurricular.length > 0) {
            // Extracurricular section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('EXTRACURRICULAR ACTIVITIES', mainContentX, mainY, { width: mainContentWidth });
            mainY += 8;
            
            for (let i = 0; i < data.extracurricular.length; i++) {
              const extra = data.extracurricular[i];
              
              // Draw accent dot
              doc.circle(mainContentX + 4, mainY + 4, 4)
                 .fill(style.accentColor);
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(extra.role, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
              mainY += 5;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${extra.organization} | ${formatDate(extra.startDate)} - ${extra.isCurrent ? 'Present' : formatDate(extra.endDate)}`, 
                       mainContentX + 10, mainY, { width: mainContentWidth - 10, oblique: true });
              mainY += 5;
              
              if (extra.description) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(extra.description, mainContentX + 10, mainY, { width: mainContentWidth - 10 });
                const textHeight = doc.heightOfString(extra.description, { width: mainContentWidth - 10 });
                mainY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.extracurricular.length - 1) {
                mainY += 10; // 5mm entry spacing
              }
            }
          }
          
          // If we're getting close to the end of the page, add a new page
          if (mainY > doc.page.height - 100) {
            doc.addPage();
            mainY = margin;
          }
        }
      } else {
        // All other templates (professional, academic, creative, minimalist)
        let currentY = margin;
        
        // Header area
        doc.font(style.titleFont)
           .fontSize(14)
           .fill(style.textColor)
           .text(`${data.personal.firstName} ${data.personal.lastName}`, margin, currentY, { width: contentWidth });
        currentY += 6;
        
        // Contact info
        // Calculate width for contact info (leave space for photo if included)
        const effectiveWidth = includePhoto ? (contentWidth - 50) : contentWidth;
        
        doc.font(style.bodyFont)
           .fontSize(11)
           .fillColor('#555555')
           .text(`Email: ${data.personal.email} | Phone: ${data.personal.phone}${data.personal.linkedin ? ` | LinkedIn: linkedin.com/in/${data.personal.linkedin}` : ''}`, 
                 margin, currentY, { width: effectiveWidth, align: 'left', lineBreak: true });
        currentY += 8;
        
        // Profile photo
        if (includePhoto && data.personal.photoUrl) {
          const photoImage = prepareImage(data.personal.photoUrl);
          if (photoImage) {
            const photoSize = 40; // 40mm -> ~113pt
            doc.image(photoImage, doc.page.width - margin - photoSize, margin, {
              width: photoSize,
              height: photoSize,
              fit: [photoSize, photoSize]
            });
          }
        }
        
        // Divider
        doc.moveTo(margin, currentY)
           .lineTo(doc.page.width - margin, currentY)
           .lineWidth(1)
           .stroke(style.accentColor);
        currentY += 7;
        
        // Render ordered sections
        for (const section of sectionOrder) {
          if (section.id === 'summary' && data.professional?.summary) {
            // Summary section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('Professional Summary', margin, currentY, { width: contentWidth });
            currentY += 6;
            
            if (templateType === 'professional') {
              // Add underline for professional template
              doc.moveTo(margin, currentY - 2)
                 .lineTo(doc.page.width - margin, currentY - 2)
                 .lineWidth(0.5)
                 .stroke('#dddddd');
            }
            
            currentY += 3;
            
            doc.font(style.bodyFont)
               .fontSize(11)
               .fill(style.textColor)
               .text(data.professional.summary, margin, currentY, { width: contentWidth, align: 'left', lineBreak: true });
            const textHeight = doc.heightOfString(data.professional.summary, { width: contentWidth });
            currentY += textHeight + 7; // 7mm section spacing
          }
          else if (section.id === 'keyCompetencies' && data.keyCompetencies) {
            // Key Competencies section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('Key Competencies', margin, currentY, { width: contentWidth });
            currentY += 6;
            
            if (templateType === 'professional') {
              // Add underline for professional template
              doc.moveTo(margin, currentY - 2)
                 .lineTo(doc.page.width - margin, currentY - 2)
                 .lineWidth(0.5)
                 .stroke('#dddddd');
            }
            
            currentY += 3;
            
            if (data.keyCompetencies.technicalSkills && data.keyCompetencies.technicalSkills.length > 0) {
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text('Technical Skills', margin, currentY, { width: contentWidth });
              currentY += 4;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .text(data.keyCompetencies.technicalSkills.join(', '), 
                      margin, currentY, { width: contentWidth });
              const techHeight = doc.heightOfString(data.keyCompetencies.technicalSkills.join(', '), { width: contentWidth });
              currentY += techHeight + 6;
            }
            
            if (data.keyCompetencies.softSkills && data.keyCompetencies.softSkills.length > 0) {
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text('Soft Skills', margin, currentY, { width: contentWidth });
              currentY += 4;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .text(data.keyCompetencies.softSkills.join(', '), 
                      margin, currentY, { width: contentWidth });
              const softHeight = doc.heightOfString(data.keyCompetencies.softSkills.join(', '), { width: contentWidth });
              currentY += softHeight + 7; // 7mm section spacing
            }
            
            currentY += 0; // No additional spacing needed
          }
          else if (section.id === 'experience' && data.experience && data.experience.length > 0) {
            // Experience section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('Professional Experience', margin, currentY, { width: contentWidth });
            currentY += 6;
            
            if (templateType === 'professional') {
              // Add underline for professional template
              doc.moveTo(margin, currentY - 2)
                 .lineTo(doc.page.width - margin, currentY - 2)
                 .lineWidth(0.5)
                 .stroke('#dddddd');
            }
            
            currentY += 3;
            
            for (let i = 0; i < data.experience.length; i++) {
              const exp = data.experience[i];
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(exp.jobTitle, margin, currentY, { width: contentWidth });
              currentY += 4;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${exp.companyName} | ${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate)}`, 
                      margin, currentY, { width: contentWidth, oblique: true });
              currentY += 5;
              
              if (exp.responsibilities) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(exp.responsibilities, margin, currentY, { width: contentWidth, align: 'left', lineBreak: true });
                const textHeight = doc.heightOfString(exp.responsibilities, { width: contentWidth });
                currentY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.experience.length - 1) {
                currentY += 10; // 5mm entry spacing
              }
            }
            
            currentY += 15; // 7mm section spacing
          }
          else if (section.id === 'education' && data.education && data.education.length > 0) {
            // Education section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('Education', margin, currentY, { width: contentWidth });
            currentY += 6;
            
            if (templateType === 'professional') {
              // Add underline for professional template
              doc.moveTo(margin, currentY - 2)
                 .lineTo(doc.page.width - margin, currentY - 2)
                 .lineWidth(0.5)
                 .stroke('#dddddd');
            }
            
            currentY += 3;
            
            for (let i = 0; i < data.education.length; i++) {
              const edu = data.education[i];
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(edu.major, margin, currentY, { width: contentWidth });
              currentY += 4;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${edu.schoolName} | ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}`, 
                      margin, currentY, { width: contentWidth, oblique: true });
              currentY += 5;
              
              if (edu.achievements) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(edu.achievements, margin, currentY, { width: contentWidth, align: 'left', lineBreak: true });
                const textHeight = doc.heightOfString(edu.achievements, { width: contentWidth });
                currentY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.education.length - 1) {
                currentY += 10; // 5mm entry spacing
              }
            }
            
            currentY += 15; // 7mm section spacing
          }
          else if (section.id === 'certificates' && data.certificates && data.certificates.length > 0) {
            // Certificates section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('Certificates', margin, currentY, { width: contentWidth });
            currentY += 6;
            
            if (templateType === 'professional') {
              // Add underline for professional template
              doc.moveTo(margin, currentY - 2)
                 .lineTo(doc.page.width - margin, currentY - 2)
                 .lineWidth(0.5)
                 .stroke('#dddddd');
            }
            
            currentY += 3;
            
            for (let i = 0; i < data.certificates.length; i++) {
              const cert = data.certificates[i];
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(cert.name, margin, currentY, { width: contentWidth });
              currentY += 4;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${cert.institution} | ${formatDate(cert.dateAcquired)}${cert.expirationDate ? ` (Expires: ${formatDate(cert.expirationDate)})` : ''}`, 
                      margin, currentY, { width: contentWidth, oblique: true });
              currentY += 5;
              
              if (cert.achievements) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(cert.achievements, margin, currentY, { width: contentWidth });
                const textHeight = doc.heightOfString(cert.achievements, { width: contentWidth });
                currentY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.certificates.length - 1) {
                currentY += 10; // 5mm entry spacing
              }
            }
            
            currentY += 15; // 7mm section spacing
          }
          else if (section.id === 'extracurricular' && data.extracurricular && data.extracurricular.length > 0) {
            // Extracurricular section
            doc.font(style.titleFont)
               .fontSize(12)
               .fill(style.titleColor)
               .text('Extracurricular Activities', margin, currentY, { width: contentWidth });
            currentY += 6;
            
            if (templateType === 'professional') {
              // Add underline for professional template
              doc.moveTo(margin, currentY - 2)
                 .lineTo(doc.page.width - margin, currentY - 2)
                 .lineWidth(0.5)
                 .stroke('#dddddd');
            }
            
            currentY += 3;
            
            for (let i = 0; i < data.extracurricular.length; i++) {
              const extra = data.extracurricular[i];
              
              doc.font(style.titleFont)
                 .fontSize(11)
                 .fill(style.textColor)
                 .text(extra.role, margin, currentY, { width: contentWidth });
              currentY += 4;
              
              doc.font(style.bodyFont)
                 .fontSize(11)
                 .fillColor('#555555')
                 .text(`${extra.organization} | ${formatDate(extra.startDate)} - ${extra.isCurrent ? 'Present' : formatDate(extra.endDate)}`, 
                      margin, currentY, { width: contentWidth, oblique: true });
              currentY += 5;
              
              if (extra.description) {
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .fillColor(style.textColor)
                   .text(extra.description, margin, currentY, { width: contentWidth });
                const textHeight = doc.heightOfString(extra.description, { width: contentWidth });
                currentY += textHeight + 2;
              }
              
              // Add spacing between entries (except for the last one)
              if (i < data.extracurricular.length - 1) {
                currentY += 10; // 5mm entry spacing
              }
            }
            
            currentY += 15; // 7mm section spacing
          }
          else if (section.id === 'additional') {
            // Additional Information section
            const hasSkills = data.additional?.skills?.length > 0;
            const hasLanguages = data.languages?.length > 0;
            
            if (hasSkills || hasLanguages) {
              doc.font(style.titleFont)
                 .fontSize(12)
                 .fill(style.titleColor)
                 .text('Additional Information', margin, currentY, { width: contentWidth });
              currentY += 6;
              
              if (templateType === 'professional') {
                // Add underline for professional template
                doc.moveTo(margin, currentY - 2)
                   .lineTo(doc.page.width - margin, currentY - 2)
                   .lineWidth(0.5)
                   .stroke('#dddddd');
              }
              
              currentY += 3;
              
              if (hasSkills) {
                doc.font(style.titleFont)
                   .fontSize(11)
                   .fill(style.textColor)
                   .text('Computer Skills', margin, currentY, { width: contentWidth });
                currentY += 4;
                
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .text(data.additional.skills.join(', '), 
                        margin, currentY, { width: contentWidth });
                const skillsHeight = doc.heightOfString(data.additional.skills.join(', '), { width: contentWidth });
                currentY += skillsHeight + 7;
              }
              
              if (hasLanguages) {
                doc.font(style.titleFont)
                   .fontSize(11)
                   .fill(style.textColor)
                   .text('Languages', margin, currentY, { width: contentWidth });
                currentY += 4;
                
                const languageText = data.languages.map(lang => 
                  `${lang.name} (${capitalize(lang.proficiency)})`
                ).join(', ');
                
                doc.font(style.bodyFont)
                   .fontSize(11)
                   .text(languageText, margin, currentY, { width: contentWidth });
                const langHeight = doc.heightOfString(languageText, { width: contentWidth });
                currentY += langHeight + 7;
              }
            }
          }
          
          // If we're getting close to the end of the page, add a new page
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = margin;
          }
        }
      }
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      reject(new Error(`Failed to generate PDF: ${errorMessage}`));
    }
  });
}