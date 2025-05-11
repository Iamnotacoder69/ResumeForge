import puppeteer from 'puppeteer-core';
import { CompleteCV } from '@shared/types';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

/**
 * Generate a PDF from CV data using Puppeteer Core
 * @param data CV data to include in the PDF
 * @returns Path to the generated PDF file
 */
export async function generatePDF(data: CompleteCV): Promise<string> {
  try {
    console.log('Starting PDF generation with Puppeteer Core');
    
    // Get HTML content
    const htmlContent = generateHTMLFromCV(data);
    
    // Create a temporary file path
    const tmpDir = os.tmpdir();
    const fileName = `cv_${uuidv4()}.pdf`;
    const outputPath = path.join(tmpDir, fileName);
    
    console.log(`Launching browser for PDF generation, output path: ${outputPath}`);
    
    // Launch puppeteer with necessary flags for Replit environment
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--single-process'
      ],
    });
    
    console.log('Browser launched, creating page');
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    console.log('Content loaded, generating PDF');
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });
    
    console.log('PDF generated, closing browser');
    
    await browser.close();
    
    return outputPath;
  } catch (error: any) {
    console.error('Error generating PDF with Puppeteer:', error);
    throw new Error(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate HTML content from CV data
 * @param data CV data
 * @returns HTML string representation of the CV
 */
function generateHTMLFromCV(data: CompleteCV): string {
  // Generate basic HTML structure
  const { personal, professional, keyCompetencies, experience, education, certificates, languages, extracurricular, additional, templateSettings } = data;
  
  // Defaults for template
  const template = templateSettings?.template || 'professional';
  const includePhoto = templateSettings?.includePhoto || false;
  
  // Basic styling for the CV
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${personal?.firstName || ''} ${personal?.lastName || ''} - CV</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 210mm;
          margin: 0 auto;
          padding: 2rem;
        }
        .header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #043e44;
        }
        .title {
          font-size: 18px;
          color: #03d27c;
          margin-bottom: 0.5rem;
        }
        .contact {
          font-size: 12px;
          color: #555;
        }
        .section {
          margin-bottom: 1.5rem;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          border-bottom: 2px solid #03d27c;
          padding-bottom: 0.2rem;
          margin-bottom: 0.8rem;
          color: #043e44;
        }
        .item {
          margin-bottom: 1rem;
        }
        .item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.3rem;
        }
        .item-title {
          font-weight: bold;
        }
        .item-subtitle {
          font-style: italic;
        }
        .item-date {
          color: #555;
        }
        .item-content {
          font-size: 12px;
        }
        ul {
          margin-top: 0.5rem;
          padding-left: 1.5rem;
        }
        li {
          margin-bottom: 0.3rem;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .skill-item {
          background-color: #f0f0f0;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 12px;
        }
        .photo-container {
          text-align: center;
          margin-bottom: 1rem;
        }
        .photo {
          width: 120px;
          height: 120px;
          border-radius: 60px;
          object-fit: cover;
          border: 2px solid #03d27c;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${includePhoto && personal?.photoUrl ? `
          <div class="photo-container">
            <img src="${personal.photoUrl}" alt="Profile Photo" class="photo">
          </div>
        ` : ''}
        <div class="name">${personal?.firstName || ''} ${personal?.lastName || ''}</div>
        <div class="title">${personal?.professionalTitle || ''}</div>
        <div class="contact">
          ${personal?.email ? `${personal.email} • ` : ''}
          ${personal?.phone ? `${personal.phone}` : ''}
          ${personal?.linkedin ? ` • linkedin.com/in/${personal.linkedin}` : ''}
        </div>
      </div>
      
      ${summary?.summary ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <p>${summary.summary}</p>
        </div>
      ` : ''}
      
      ${keyCompetencies?.technicalSkills?.length || keyCompetencies?.softSkills?.length ? `
        <div class="section">
          <div class="section-title">Key Competencies</div>
          ${keyCompetencies?.technicalSkills?.length ? `
            <div class="item">
              <div class="item-title">Technical Skills</div>
              <div class="skills-list">
                ${keyCompetencies.technicalSkills.map(skill => `
                  <span class="skill-item">${skill}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${keyCompetencies?.softSkills?.length ? `
            <div class="item">
              <div class="item-title">Soft Skills</div>
              <div class="skills-list">
                ${keyCompetencies.softSkills.map(skill => `
                  <span class="skill-item">${skill}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      ${experience?.length ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${experience.map(job => `
            <div class="item">
              <div class="item-header">
                <div>
                  <div class="item-title">${job.jobTitle}</div>
                  <div class="item-subtitle">${job.companyName}</div>
                </div>
                <div class="item-date">
                  ${job.startDate} - ${job.isCurrent ? 'Present' : job.endDate || ''}
                </div>
              </div>
              <div class="item-content">
                ${formatContentWithBullets(job.responsibilities)}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${education?.length ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${education.map(edu => `
            <div class="item">
              <div class="item-header">
                <div>
                  <div class="item-title">${edu.major}</div>
                  <div class="item-subtitle">${edu.schoolName}</div>
                </div>
                <div class="item-date">
                  ${edu.startDate} - ${edu.endDate || ''}
                </div>
              </div>
              ${edu.achievements ? `
                <div class="item-content">
                  ${formatContentWithBullets(edu.achievements)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${certificates?.length ? `
        <div class="section">
          <div class="section-title">Certifications</div>
          ${certificates.map(cert => `
            <div class="item">
              <div class="item-header">
                <div>
                  <div class="item-title">${cert.name}</div>
                  <div class="item-subtitle">${cert.institution}</div>
                </div>
                <div class="item-date">
                  ${cert.dateAcquired}${cert.expirationDate ? ` - ${cert.expirationDate}` : ''}
                </div>
              </div>
              ${cert.achievements ? `
                <div class="item-content">
                  ${formatContentWithBullets(cert.achievements)}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${languages?.length ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills-list">
            ${languages.map(lang => `
              <span class="skill-item">${lang.name} - ${formatProficiency(lang.proficiency)}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${extracurricular?.length ? `
        <div class="section">
          <div class="section-title">Extracurricular Activities</div>
          ${extracurricular.map(extra => `
            <div class="item">
              <div class="item-header">
                <div>
                  <div class="item-title">${extra.role}</div>
                  <div class="item-subtitle">${extra.organization}</div>
                </div>
                <div class="item-date">
                  ${extra.startDate} - ${extra.isCurrent ? 'Present' : extra.endDate || ''}
                </div>
              </div>
              <div class="item-content">
                ${formatContentWithBullets(extra.description)}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${additional?.skills?.length ? `
        <div class="section">
          <div class="section-title">Additional Skills</div>
          <div class="skills-list">
            ${additional.skills.map(skill => `
              <span class="skill-item">${skill}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </body>
    </html>
  `;
  
  return htmlContent;
}

/**
 * Format text content with bullet points
 * @param content Text content to format
 * @returns HTML with bullet points
 */
function formatContentWithBullets(content: string): string {
  if (!content) return '';
  
  // Split by newlines and convert to bullet points
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length <= 1) {
    return `<p>${content}</p>`;
  }
  
  return `
    <ul>
      ${lines.map(line => `<li>${line.trim()}</li>`).join('')}
    </ul>
  `;
}

/**
 * Format language proficiency level for display
 * @param proficiency Proficiency level
 * @returns Formatted proficiency text
 */
function formatProficiency(proficiency: string): string {
  const levels: Record<string, string> = {
    'native': 'Native',
    'fluent': 'Fluent',
    'advanced': 'Advanced',
    'intermediate': 'Intermediate',
    'basic': 'Basic'
  };
  
  return levels[proficiency] || proficiency;
}