import puppeteer from 'puppeteer';
import { CompleteCV } from '../shared/types';
import { Experience, Education, Certificate, Extracurricular } from '../shared/types';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Puppeteer configuration directly embedded in the code
// No file system dependencies that could cause issues in production
const puppeteerConfig = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu'
  ],
  headless: true
};

/**
 * Generates a PDF from CV data using Puppeteer
 * @param cvData The complete CV data
 * @returns Buffer containing the generated PDF
 */
export async function generatePDF(cvData: CompleteCV): Promise<Buffer> {
  console.log('Starting PDF generation with Puppeteer');
  
  // Simplified browser launch options for better compatibility with Railway
  const launchOptions = {
    executablePath: process.env.CHROME_PATH || undefined, // Use the environment variable if available
    args: puppeteerConfig.args,
    headless: true // Force headless mode for production environments
  };
  
  console.log('Launching Puppeteer for PDF generation');
  
  // Launch a browser with the configuration options
  const browser = await puppeteer.launch(launchOptions);
  
  try {
    const page = await browser.newPage();
    
    // Set the viewport to A4 size
    await page.setViewport({
      width: 795, // A4 width in pixels at 96 DPI (210mm)
      height: 1122, // A4 height in pixels at 96 DPI (297mm)
      deviceScaleFactor: 2, // Higher resolution
    });
    
    // Generate HTML content for the CV
    const htmlContent = generateCVHtml(cvData);
    
    // Set the HTML content
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Add print styles
    await page.addStyleTag({
      content: `
        @page {
          margin: 0;
          size: A4;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', 'Helvetica', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
      `
    });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    
    console.log('PDF generation complete');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await browser.close();
  }
}

/**
 * Generate HTML string for the CV based on the provided data and template
 * @param cvData Complete CV data
 * @returns HTML string
 */
function generateCVHtml(cvData: CompleteCV): string {
  // Default to the professional template if none specified
  const template = cvData.templateSettings?.template || 'professional';
  
  // Generate HTML based on template type
  switch (template) {
    case 'modern':
      return generateModernTemplateHtml(cvData);
    case 'minimal':
      return generateMinimalTemplateHtml(cvData);
    case 'professional':
    default:
      return generateProfessionalTemplateHtml(cvData);
  }
}

/**
 * Generate HTML for the professional template
 */
function generateProfessionalTemplateHtml(cvData: CompleteCV): string {
  const { personal, professional, keyCompetencies, templateSettings } = cvData;
  const experiences = 'experiences' in cvData ? (cvData as any).experiences : [];
  const educations = 'educations' in cvData ? (cvData as any).educations : [];
  const certificates = 'certificates' in cvData ? (cvData as any).certificates : [];
  const extracurricular = 'extracurricular' in cvData ? (cvData as any).extracurricular : [];
  
  // Determine which sections to display based on section order
  const sectionOrder = templateSettings?.sectionOrder || [];
  const visibleSections = sectionOrder.filter(section => section.visible)
    .sort((a, b) => a.order - b.order)
    .map(section => section.id);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${personal.firstName} ${personal.lastName} - CV</title>
      <style>
        body {
          font-family: 'Inter', 'Helvetica', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
        }
        .cv-container {
          width: 210mm;
          min-height: 297mm;
          padding: 0;
          margin: 0 auto;
          background: white;
        }
        .header {
          background-color: #043e44;
          color: white;
          padding: 30px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-content {
          flex: 1;
        }
        .header-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid white;
          margin-left: 20px;
        }
        .header-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
        }
        h2 {
          margin: 0 0 5px;
          font-size: 20px;
          font-weight: 500;
          color: #03d27c;
        }
        h3 {
          margin: 0 0 10px;
          font-size: 18px;
          font-weight: 600;
        }
        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .contact-info {
          margin-top: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          font-size: 14px;
        }
        .contact-item {
          display: flex;
          align-items: center;
        }
        .main {
          display: flex;
          padding: 30px 0;
        }
        .left-column {
          flex: 2;
          padding: 0 40px;
        }
        .right-column {
          flex: 1;
          padding: 0 40px;
          background-color: #f5f5f5;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 20px;
          color: #043e44;
          border-bottom: 2px solid #03d27c;
          padding-bottom: 5px;
          margin-bottom: 15px;
        }
        .experience-item, .education-item {
          margin-bottom: 20px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .date {
          color: #666;
          font-size: 14px;
        }
        .description {
          color: #555;
          font-size: 14px;
          line-height: 1.5;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .skill-pill {
          background-color: #03d27c;
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 500;
        }
        .soft-skill-pill {
          background-color: #043e44;
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <h1>${personal.firstName} ${personal.lastName}</h1>
            <h2>${personal.professionalTitle || ''}</h2>
            <div class="contact-info">
              ${personal.email ? `<div class="contact-item">${personal.email}</div>` : ''}
              ${personal.phone ? `<div class="contact-item">${personal.phone}</div>` : ''}
              ${personal.linkedin ? `<div class="contact-item">${personal.linkedin}</div>` : ''}
            </div>
          </div>
          ${personal.photoUrl && templateSettings?.includePhoto ? 
            `<div class="header-photo">
              <img src="${personal.photoUrl}" alt="Profile Photo" />
            </div>` : ''}
        </div>
        
        <div class="main">
          <div class="left-column">
            <!-- Professional Summary -->
            ${visibleSections.includes('summary') && professional?.summary ? `
            <div class="section">
              <h3 class="section-title">Professional Summary</h3>
              <div class="description">${professional.summary}</div>
            </div>` : ''}
            
            <!-- Experience -->
            ${visibleSections.includes('experience') && experiences && experiences.length > 0 ? `
            <div class="section">
              <h3 class="section-title">Professional Experience</h3>
              ${experiences.map((exp: Experience) => `
                <div class="experience-item">
                  <div class="item-header">
                    <h4>${exp.jobTitle} at ${exp.companyName}</h4>
                    <div class="date">${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}</div>
                  </div>
                  <div class="description">${exp.responsibilities}</div>
                </div>
              `).join('')}
            </div>` : ''}
            
            <!-- Education -->
            ${visibleSections.includes('education') && educations && educations.length > 0 ? `
            <div class="section">
              <h3 class="section-title">Education</h3>
              ${educations.map((edu: Education) => `
                <div class="education-item">
                  <div class="item-header">
                    <h4>${edu.major} at ${edu.schoolName}</h4>
                    <div class="date">${edu.startDate} - ${edu.endDate || ''}</div>
                  </div>
                  ${edu.achievements ? `<div class="description">${edu.achievements}</div>` : ''}
                </div>
              `).join('')}
            </div>` : ''}
            
            <!-- Certificates -->
            ${visibleSections.includes('certificates') && certificates && certificates.length > 0 ? `
            <div class="section">
              <h3 class="section-title">Certifications</h3>
              ${certificates.map((cert: Certificate) => `
                <div class="education-item">
                  <div class="item-header">
                    <h4>${cert.name} - ${cert.institution}</h4>
                    <div class="date">Acquired: ${cert.dateAcquired}${cert.expirationDate ? ` · Expires: ${cert.expirationDate}` : ''}</div>
                  </div>
                  ${cert.achievements ? `<div class="description">${cert.achievements}</div>` : ''}
                </div>
              `).join('')}
            </div>` : ''}
          </div>
          
          <div class="right-column">
            <!-- Key Competencies -->
            ${visibleSections.includes('keyCompetencies') && keyCompetencies ? `
            <div class="section">
              <h3 class="section-title">Technical Skills</h3>
              <div class="skills-list">
                ${keyCompetencies.technicalSkills.map(skill => `
                  <span class="skill-pill">${skill}</span>
                `).join('')}
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Soft Skills</h3>
              <div class="skills-list">
                ${keyCompetencies.softSkills.map(skill => `
                  <span class="skill-pill soft-skill-pill">${skill}</span>
                `).join('')}
              </div>
            </div>` : ''}
            
            <!-- Extracurricular Activities -->
            ${visibleSections.includes('extracurricular') && extracurricular && extracurricular.length > 0 ? `
            <div class="section">
              <h3 class="section-title">Extracurricular Activities</h3>
              ${extracurricular.map((extra: Extracurricular) => `
                <div class="experience-item">
                  <div class="item-header">
                    <h4>${extra.role} at ${extra.organization}</h4>
                    <div class="date">${extra.startDate} - ${extra.isCurrent ? 'Present' : extra.endDate || ''}</div>
                  </div>
                  <div class="description">${extra.description}</div>
                </div>
              `).join('')}
            </div>` : ''}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for the modern template
 */
function generateModernTemplateHtml(cvData: CompleteCV): string {
  const { personal, professional, keyCompetencies, templateSettings } = cvData;
  const experiences = 'experiences' in cvData ? (cvData as any).experiences as Experience[] : [];
  const educations = 'educations' in cvData ? (cvData as any).educations as Education[] : [];
  const certificates = 'certificates' in cvData ? (cvData as any).certificates as Certificate[] : [];
  const extracurricular = 'extracurricular' in cvData ? (cvData as any).extracurricular as Extracurricular[] : [];
  
  // Determine which sections to display based on section order
  const sectionOrder = templateSettings?.sectionOrder || [];
  const visibleSections = sectionOrder.filter(section => section.visible)
    .sort((a, b) => a.order - b.order)
    .map(section => section.id);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${personal.firstName} ${personal.lastName} - CV</title>
      <style>
        body {
          font-family: 'Inter', 'Helvetica', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
        }
        .cv-container {
          width: 210mm;
          min-height: 297mm;
          padding: 0;
          margin: 0 auto;
          background: white;
          display: grid;
          grid-template-columns: 2fr 1fr;
        }
        .main-column {
          padding: 40px;
        }
        .side-column {
          background-color: #03d27c;
          color: white;
          padding: 40px;
        }
        .header {
          margin-bottom: 30px;
        }
        .profile-photo {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          margin: 0 auto 20px;
          overflow: hidden;
          border: 3px solid white;
        }
        .profile-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #043e44;
        }
        .side-column h1 {
          text-align: center;
          color: white;
        }
        h2 {
          margin: 5px 0 20px;
          font-size: 18px;
          font-weight: 500;
          color: #03d27c;
        }
        .side-column h2 {
          text-align: center;
          color: white;
          opacity: 0.9;
        }
        h3 {
          margin: 0 0 15px;
          font-size: 18px;
          font-weight: 600;
          color: #043e44;
        }
        .side-column h3 {
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding-bottom: 8px;
        }
        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .contact-info {
          margin-top: 25px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
        }
        .experience-item, .education-item {
          margin-bottom: 25px;
        }
        .item-header {
          margin-bottom: 8px;
        }
        .company, .school {
          font-weight: 600;
          color: #03d27c;
        }
        .side-column .company, .side-column .school {
          color: rgba(255, 255, 255, 0.9);
        }
        .date {
          color: #666;
          font-size: 14px;
          margin-top: 2px;
        }
        .side-column .date {
          color: rgba(255, 255, 255, 0.7);
        }
        .description {
          color: #555;
          font-size: 14px;
          line-height: 1.5;
        }
        .side-column .description {
          color: rgba(255, 255, 255, 0.9);
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }
        .skill-pill {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 4px 12px;
          border-radius: 15px;
          font-size: 12px;
        }
        .main-skill-pill {
          background-color: #03d27c;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <div class="main-column">
          <!-- Header -->
          <div class="header">
            <h1>${personal.firstName} ${personal.lastName}</h1>
            <h2>${personal.professionalTitle || ''}</h2>
          </div>
          
          <!-- Professional Summary -->
          ${visibleSections.includes('summary') && professional?.summary ? `
          <div class="section">
            <h3>Professional Summary</h3>
            <div class="description">${professional.summary}</div>
          </div>` : ''}
          
          <!-- Experience -->
          ${visibleSections.includes('experience') && experiences && experiences.length > 0 ? `
          <div class="section">
            <h3>Professional Experience</h3>
            ${experiences.map(exp => `
              <div class="experience-item">
                <div class="item-header">
                  <h4>${exp.jobTitle}</h4>
                  <div class="company">${exp.companyName}</div>
                  <div class="date">${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}</div>
                </div>
                <div class="description">${exp.responsibilities}</div>
              </div>
            `).join('')}
          </div>` : ''}
          
          <!-- Education -->
          ${visibleSections.includes('education') && educations && educations.length > 0 ? `
          <div class="section">
            <h3>Education</h3>
            ${educations.map(edu => `
              <div class="education-item">
                <div class="item-header">
                  <h4>${edu.major}</h4>
                  <div class="school">${edu.schoolName}</div>
                  <div class="date">${edu.startDate} - ${edu.endDate || ''}</div>
                </div>
                ${edu.achievements ? `<div class="description">${edu.achievements}</div>` : ''}
              </div>
            `).join('')}
          </div>` : ''}
        </div>
        
        <div class="side-column">
          <!-- Profile Photo -->
          ${personal.photoUrl && templateSettings?.includePhoto ? `
          <div class="profile-photo">
            <img src="${personal.photoUrl}" alt="Profile Photo" />
          </div>` : ''}
          
          <!-- Contact Information -->
          <div class="contact-info">
            ${personal.email ? `<div class="contact-item">${personal.email}</div>` : ''}
            ${personal.phone ? `<div class="contact-item">${personal.phone}</div>` : ''}
            ${personal.linkedin ? `<div class="contact-item">${personal.linkedin}</div>` : ''}
          </div>
          
          <!-- Key Competencies -->
          ${visibleSections.includes('keyCompetencies') && keyCompetencies ? `
          <div class="section">
            <h3>Technical Skills</h3>
            <div class="skills-list">
              ${keyCompetencies.technicalSkills.map(skill => `
                <span class="skill-pill">${skill}</span>
              `).join('')}
            </div>
          </div>
          
          <div class="section">
            <h3>Soft Skills</h3>
            <div class="skills-list">
              ${keyCompetencies.softSkills.map(skill => `
                <span class="skill-pill">${skill}</span>
              `).join('')}
            </div>
          </div>` : ''}
          
          <!-- Certificates -->
          ${visibleSections.includes('certificates') && certificates && certificates.length > 0 ? `
          <div class="section">
            <h3>Certifications</h3>
            ${certificates.map(cert => `
              <div class="education-item">
                <div class="item-header">
                  <h4>${cert.name}</h4>
                  <div class="school">${cert.institution}</div>
                  <div class="date">Acquired: ${cert.dateAcquired}${cert.expirationDate ? ` · Expires: ${cert.expirationDate}` : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>` : ''}
          
          <!-- Extracurricular Activities -->
          ${visibleSections.includes('extracurricular') && extracurricular && extracurricular.length > 0 ? `
          <div class="section">
            <h3>Extracurricular Activities</h3>
            ${extracurricular.map(extra => `
              <div class="experience-item">
                <div class="item-header">
                  <h4>${extra.role}</h4>
                  <div class="company">${extra.organization}</div>
                  <div class="date">${extra.startDate} - ${extra.isCurrent ? 'Present' : extra.endDate || ''}</div>
                </div>
                <div class="description">${extra.description}</div>
              </div>
            `).join('')}
          </div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML for the minimal template
 */
function generateMinimalTemplateHtml(cvData: CompleteCV): string {
  const { personal, professional, keyCompetencies, templateSettings } = cvData;
  const experiences = 'experiences' in cvData ? (cvData as any).experiences as Experience[] : [];
  const educations = 'educations' in cvData ? (cvData as any).educations as Education[] : [];
  const certificates = 'certificates' in cvData ? (cvData as any).certificates as Certificate[] : [];
  const extracurricular = 'extracurricular' in cvData ? (cvData as any).extracurricular as Extracurricular[] : [];
  
  // Determine which sections to display based on section order
  const sectionOrder = templateSettings?.sectionOrder || [];
  const visibleSections = sectionOrder.filter(section => section.visible)
    .sort((a, b) => a.order - b.order)
    .map(section => section.id);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${personal.firstName} ${personal.lastName} - CV</title>
      <style>
        body {
          font-family: 'Inter', 'Helvetica', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: white;
        }
        .cv-container {
          width: 210mm;
          min-height: 297mm;
          padding: 40px;
          margin: 0 auto;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eee;
        }
        .profile-photo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 20px;
          overflow: hidden;
        }
        .profile-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #333;
        }
        h2 {
          margin: 5px 0 15px;
          font-size: 18px;
          font-weight: 400;
          color: #666;
        }
        .contact-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 15px;
          font-size: 14px;
          color: #666;
        }
        h3 {
          margin: 30px 0 15px;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #333;
        }
        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .section {
          margin-bottom: 30px;
        }
        .experience-item, .education-item {
          margin-bottom: 20px;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .item-title {
          font-weight: 600;
        }
        .date {
          color: #888;
          font-size: 14px;
        }
        .description {
          color: #555;
          font-size: 14px;
          line-height: 1.5;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
        }
        .skills-column {
          flex: 1;
          min-width: 200px;
        }
        .skills-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        .skills-list li {
          margin-bottom: 8px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <!-- Header -->
        <div class="header">
          ${personal.photoUrl && templateSettings?.includePhoto ? `
          <div class="profile-photo">
            <img src="${personal.photoUrl}" alt="Profile Photo" />
          </div>` : ''}
          
          <h1>${personal.firstName} ${personal.lastName}</h1>
          <h2>${personal.professionalTitle || ''}</h2>
          
          <div class="contact-info">
            ${personal.email ? `<div>${personal.email}</div>` : ''}
            ${personal.phone ? `<div>${personal.phone}</div>` : ''}
            ${personal.linkedin ? `<div>${personal.linkedin}</div>` : ''}
          </div>
        </div>
        
        <!-- Professional Summary -->
        ${visibleSections.includes('summary') && professional?.summary ? `
        <div class="section">
          <h3>About Me</h3>
          <div class="description">${professional.summary}</div>
        </div>` : ''}
        
        <!-- Experience -->
        ${visibleSections.includes('experience') && experiences && experiences.length > 0 ? `
        <div class="section">
          <h3>Experience</h3>
          ${experiences.map(exp => `
            <div class="experience-item">
              <div class="item-header">
                <div>
                  <h4>${exp.jobTitle} | ${exp.companyName}</h4>
                </div>
                <div class="date">${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}</div>
              </div>
              <div class="description">${exp.responsibilities}</div>
            </div>
          `).join('')}
        </div>` : ''}
        
        <!-- Education -->
        ${visibleSections.includes('education') && educations && educations.length > 0 ? `
        <div class="section">
          <h3>Education</h3>
          ${educations.map(edu => `
            <div class="education-item">
              <div class="item-header">
                <div>
                  <h4>${edu.major} | ${edu.schoolName}</h4>
                </div>
                <div class="date">${edu.startDate} - ${edu.endDate || ''}</div>
              </div>
              ${edu.achievements ? `<div class="description">${edu.achievements}</div>` : ''}
            </div>
          `).join('')}
        </div>` : ''}
        
        <!-- Skills -->
        ${visibleSections.includes('keyCompetencies') && keyCompetencies ? `
        <div class="section">
          <h3>Skills</h3>
          <div class="skills-container">
            <div class="skills-column">
              <h4>Technical Skills</h4>
              <ul class="skills-list">
                ${keyCompetencies.technicalSkills.map(skill => `
                  <li>${skill}</li>
                `).join('')}
              </ul>
            </div>
            <div class="skills-column">
              <h4>Soft Skills</h4>
              <ul class="skills-list">
                ${keyCompetencies.softSkills.map(skill => `
                  <li>${skill}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        </div>` : ''}
        
        <!-- Certificates -->
        ${visibleSections.includes('certificates') && certificates && certificates.length > 0 ? `
        <div class="section">
          <h3>Certifications</h3>
          ${certificates.map(cert => `
            <div class="education-item">
              <div class="item-header">
                <div>
                  <h4>${cert.name} | ${cert.institution}</h4>
                </div>
                <div class="date">Acquired: ${cert.dateAcquired}${cert.expirationDate ? ` · Expires: ${cert.expirationDate}` : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>` : ''}
        
        <!-- Extracurricular Activities -->
        ${visibleSections.includes('extracurricular') && extracurricular && extracurricular.length > 0 ? `
        <div class="section">
          <h3>Extracurricular Activities</h3>
          ${extracurricular.map(extra => `
            <div class="experience-item">
              <div class="item-header">
                <div>
                  <h4>${extra.role} | ${extra.organization}</h4>
                </div>
                <div class="date">${extra.startDate} - ${extra.isCurrent ? 'Present' : extra.endDate || ''}</div>
              </div>
              <div class="description">${extra.description}</div>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    </body>
    </html>
  `;
}