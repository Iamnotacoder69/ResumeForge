import fs from 'fs';
import path from 'path';
// @ts-ignore
import wkhtmltopdf from 'wkhtmltopdf';
import { CompleteCV } from '@shared/types';
// @ts-ignore
import * as wkhtmlPath from 'wkhtmltopdf-installer';

// Ensure binary path is set correctly
const wkhtmltopdfPath = wkhtmlPath.path;

// Configure wkhtmltopdf with the binary path
wkhtmltopdf.command = wkhtmltopdfPath;

/**
 * Renders a CV to PDF using wkhtmltopdf
 * 
 * @param cv The complete CV data to render
 * @param template The template to use (professional, modern, minimal)
 * @returns The path to the generated PDF file
 */
export async function renderCVToPDF(
  cv: CompleteCV, 
  template: string = 'professional'
): Promise<{ filePath: string, fileName: string }> {
  try {
    // Create a temporary directory for the files if it doesn't exist
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create a temporary HTML file to render
    const htmlPath = path.join(tempDir, `cv-${Date.now()}.html`);
    const templateHtml = generateTemplateHtml(cv, template);
    fs.writeFileSync(htmlPath, templateHtml, 'utf8');

    // Define the output PDF file
    const fileName = `${cv.personal.firstName}_${cv.personal.lastName}_CV.pdf`.replace(/\s+/g, '_');
    const pdfPath = path.join(tempDir, fileName);

    // Generate the PDF from the HTML
    return new Promise((resolve, reject) => {
      wkhtmltopdf(fs.createReadStream(htmlPath), {
        output: pdfPath,
        pageSize: 'A4',
        orientation: 'Portrait',
        marginTop: '10mm',
        marginBottom: '10mm',
        marginLeft: '10mm',
        marginRight: '10mm',
        enableSmartShrinking: true,
        printMediaType: true,
        noBackground: false,
        enableLocalFileAccess: true,
        disableJavascript: false,
        javascriptDelay: 1000
      }, (err: any) => {
        // Clean up the temporary HTML file
        try {
          fs.unlinkSync(htmlPath);
        } catch (e) {
          console.error('Error cleaning up HTML file:', e);
        }

        if (err) {
          console.error('Error generating PDF:', err);
          reject(err);
        } else {
          resolve({ filePath: pdfPath, fileName });
        }
      });
    });
  } catch (err) {
    console.error('Error in renderCVToPDF:', err);
    throw err;
  }
}

/**
 * Generates HTML for the CV template
 */
function generateTemplateHtml(cv: CompleteCV, templateType: string): string {
  // Base styles for all templates
  const baseStyles = `
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      font-size: 11pt;
      line-height: 1.5;
    }
    .cv-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      box-sizing: border-box;
    }
    h1, h2, h3, h4 {
      margin-top: 0;
      color: #043e44;
    }
    h1 {
      font-size: 16pt;
      margin-bottom: 5pt;
    }
    h2 {
      font-size: 14pt;
      margin-bottom: 5pt;
      border-bottom: 1pt solid #03d27c;
      padding-bottom: 3pt;
    }
    h3 {
      font-size: 12pt;
      margin-bottom: 3pt;
    }
    .section {
      margin-bottom: 15pt;
    }
    ul {
      margin-top: 5pt;
      margin-bottom: 5pt;
      padding-left: 15pt;
    }
    .header {
      margin-bottom: 15pt;
    }
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 10pt;
    }
    .contact-info > div {
      margin-right: 15pt;
      margin-bottom: 5pt;
    }
    .date-range {
      font-style: italic;
      color: #666;
      font-size: 10pt;
    }
    .job-title, .degree {
      font-weight: bold;
    }
    .company, .school {
      font-weight: 500;
    }
    .responsibilities {
      margin-top: 5pt;
    }
    .photo {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 50%;
      float: right;
      margin-left: 15pt;
      border: 2pt solid #03d27c;
    }
    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5pt;
      margin-top: 5pt;
    }
    .skill {
      background-color: #f0f0f0;
      padding: 2pt 8pt;
      border-radius: 12pt;
      font-size: 10pt;
    }
    .item {
      margin-bottom: 12pt;
    }
    .item:last-child {
      margin-bottom: 0;
    }
  `;

  // Template-specific styles
  let templateStyles = '';
  
  switch (templateType) {
    case 'modern':
      templateStyles = `
        body {
          font-family: 'Arial', sans-serif;
        }
        .cv-container {
          padding: 0;
        }
        .header {
          background-color: #03d27c;
          color: white;
          padding: 20pt;
          position: relative;
        }
        .header h1 {
          color: white;
          font-size: 18pt;
          margin-bottom: 2pt;
        }
        .professional-title {
          color: white;
          font-size: 12pt;
          opacity: 0.9;
          margin-bottom: 10pt;
        }
        .photo {
          border-radius: 5pt;
          border: 2pt solid white;
        }
        .contact-info {
          margin-top: 10pt;
        }
        .contact-info > div {
          color: white;
        }
        .main-content {
          padding: 20pt;
        }
        h2 {
          color: #03d27c;
          border-bottom: none;
          position: relative;
          padding-left: 10pt;
        }
        h2:before {
          content: '';
          position: absolute;
          left: 0;
          top: 25%;
          height: 50%;
          width: 4pt;
          background-color: #03d27c;
        }
        .item {
          position: relative;
          padding-left: 15pt;
        }
        .item:before {
          content: '';
          position: absolute;
          left: 3pt;
          top: 5pt;
          width: 6pt;
          height: 6pt;
          border-radius: 50%;
          background-color: #03d27c;
        }
      `;
      break;
    
    case 'minimal':
      templateStyles = `
        body {
          font-family: 'Georgia', serif;
        }
        .cv-container {
          text-align: center;
        }
        .header {
          margin-bottom: 20pt;
        }
        .header h1 {
          font-size: 18pt;
          margin-bottom: 0;
        }
        .professional-title {
          font-size: 12pt;
          font-style: italic;
          margin-bottom: 15pt;
        }
        .photo {
          float: none;
          margin: 0 auto 15pt;
          border-radius: 0;
          border: 1pt solid #eee;
        }
        .contact-info {
          justify-content: center;
          margin-bottom: 20pt;
        }
        .section h2 {
          text-transform: uppercase;
          letter-spacing: 2pt;
          font-size: 11pt;
          text-align: center;
          border-bottom: none;
          margin-bottom: 15pt;
        }
        .section h2:after {
          content: '';
          display: block;
          width: 50pt;
          height: 1pt;
          background-color: #03d27c;
          margin: 5pt auto 0;
        }
        .item {
          text-align: left;
          max-width: 500pt;
          margin-left: auto;
          margin-right: auto;
        }
        .skills-list {
          justify-content: center;
        }
      `;
      break;
    
    default: // professional
      templateStyles = `
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-text {
          flex: 1;
        }
        h2 {
          color: #043e44;
        }
        .item {
          margin-bottom: 10pt;
        }
        .section {
          margin-bottom: 20pt;
        }
      `;
      break;
  }

  // Determine which sections to include
  const visibleSections = cv.templateSettings?.sectionOrder?.filter(s => s.visible) || [];
  const orderedSections = [...visibleSections].sort((a, b) => a.order - b.order);

  // Generate the complete HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${cv.personal.firstName} ${cv.personal.lastName} - CV</title>
      <style>
        ${baseStyles}
        ${templateStyles}
      </style>
    </head>
    <body>
      <div class="cv-container">
        ${renderHeader(cv, templateType)}
        <div class="${templateType === 'modern' ? 'main-content' : ''}">
          ${orderedSections.map(section => renderSection(section.id, cv)).join('')}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Renders the CV header with personal information
 */
function renderHeader(cv: CompleteCV, templateType: string): string {
  const { personal } = cv;
  const photoHtml = personal.photoUrl && cv.templateSettings?.includePhoto
    ? `<img src="${personal.photoUrl}" alt="Profile Photo" class="photo" />`
    : '';

  const professionalTitle = personal.professionalTitle
    ? `<div class="professional-title">${personal.professionalTitle}</div>`
    : '';

  // Contact information
  const contactInfo = `
    <div class="contact-info">
      ${personal.email ? `<div>${personal.email}</div>` : ''}
      ${personal.phone ? `<div>${personal.phone}</div>` : ''}
      ${personal.linkedin ? `<div>linkedin.com/in/${personal.linkedin}</div>` : ''}
    </div>
  `;

  if (templateType === 'modern') {
    return `
      <div class="header">
        <div class="header-text">
          <h1>${personal.firstName} ${personal.lastName}</h1>
          ${professionalTitle}
          ${contactInfo}
        </div>
        ${photoHtml}
      </div>
    `;
  } else if (templateType === 'minimal') {
    return `
      <div class="header">
        ${photoHtml}
        <h1>${personal.firstName} ${personal.lastName}</h1>
        ${professionalTitle}
        ${contactInfo}
      </div>
    `;
  } else {
    // Professional template (default)
    return `
      <div class="header">
        <div class="header-text">
          <h1>${personal.firstName} ${personal.lastName}</h1>
          ${professionalTitle}
          ${contactInfo}
        </div>
        ${photoHtml}
      </div>
    `;
  }
}

/**
 * Renders a specific CV section based on the section ID
 */
function renderSection(sectionId: string, cv: CompleteCV): string {
  switch (sectionId) {
    case 'summary':
      return renderSummarySection(cv);
    case 'keyCompetencies':
      return renderKeyCompetenciesSection(cv);
    case 'experience':
      return renderExperienceSection(cv);
    case 'education':
      return renderEducationSection(cv);
    case 'extracurricular':
      return renderExtracurricularSection(cv);
    case 'additional':
      return renderAdditionalSection(cv);
    default:
      return '';
  }
}

function renderSummarySection(cv: CompleteCV): string {
  if (!cv.professional?.summary) return '';

  return `
    <div class="section">
      <h2>Professional Summary</h2>
      <p>${cv.professional.summary}</p>
    </div>
  `;
}

function renderKeyCompetenciesSection(cv: CompleteCV): string {
  if (!cv.keyCompetencies) return '';

  const { technicalSkills = [], softSkills = [] } = cv.keyCompetencies;
  
  if (technicalSkills.length === 0 && softSkills.length === 0) return '';

  const renderSkills = (skills: string[], title: string) => {
    if (skills.length === 0) return '';
    
    return `
      <div>
        <h3>${title}</h3>
        <div class="skills-list">
          ${skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
        </div>
      </div>
    `;
  };

  return `
    <div class="section">
      <h2>Key Competencies</h2>
      ${renderSkills(technicalSkills, 'Technical Skills')}
      ${renderSkills(softSkills, 'Soft Skills')}
    </div>
  `;
}

function renderExperienceSection(cv: CompleteCV): string {
  if (!cv.experience || cv.experience.length === 0) return '';

  const experienceItems = cv.experience.map(exp => {
    const dateRange = exp.isCurrent
      ? `${exp.startDate} - Present`
      : `${exp.startDate} - ${exp.endDate || ''}`;
    
    return `
      <div class="item">
        <div class="job-title">${exp.jobTitle}</div>
        <div class="company">${exp.companyName}</div>
        <div class="date-range">${dateRange}</div>
        <div class="responsibilities">${exp.responsibilities}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="section">
      <h2>Professional Experience</h2>
      ${experienceItems}
    </div>
  `;
}

function renderEducationSection(cv: CompleteCV): string {
  if (!cv.education || cv.education.length === 0) return '';

  const educationItems = cv.education.map(edu => {
    const achievements = edu.achievements
      ? `<div>${edu.achievements}</div>`
      : '';
    
    return `
      <div class="item">
        <div class="degree">${edu.major}</div>
        <div class="school">${edu.schoolName}</div>
        <div class="date-range">${edu.startDate} - ${edu.endDate || ''}</div>
        ${achievements}
      </div>
    `;
  }).join('');

  return `
    <div class="section">
      <h2>Education</h2>
      ${educationItems}
    </div>
  `;
}

function renderExtracurricularSection(cv: CompleteCV): string {
  if (!cv.extracurricular || cv.extracurricular.length === 0) return '';

  const extraItems = cv.extracurricular.map(extra => {
    const dateRange = extra.isCurrent
      ? `${extra.startDate} - Present`
      : `${extra.startDate} - ${extra.endDate || ''}`;
    
    return `
      <div class="item">
        <div class="job-title">${extra.role}</div>
        <div class="company">${extra.organization}</div>
        <div class="date-range">${dateRange}</div>
        <div class="responsibilities">${extra.description}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="section">
      <h2>Extracurricular Activities</h2>
      ${extraItems}
    </div>
  `;
}

function renderAdditionalSection(cv: CompleteCV): string {
  if (!cv.additional?.skills || cv.additional.skills.length === 0) return '';

  return `
    <div class="section">
      <h2>Additional Skills</h2>
      <div class="skills-list">
        ${cv.additional.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
      </div>
    </div>
  `;
}