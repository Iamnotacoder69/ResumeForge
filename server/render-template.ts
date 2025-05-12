import { CompleteCV, TemplateType } from '../shared/types';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Temporary storage for CV data (in production, consider using Redis or similar)
interface TemporaryCV {
  cv: CompleteCV;
  createdAt: number; // timestamp
  expiresAt: number; // timestamp
}

// In-memory storage with expiration (would use Redis in production)
const tempCVStorage = new Map<string, TemporaryCV>();

// Clean up expired temporary CVs
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of tempCVStorage.entries()) {
    if (data.expiresAt < now) {
      tempCVStorage.delete(id);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

/**
 * Store CV data temporarily and return a unique ID
 * @param cv The CV data to store
 * @returns Unique ID for retrieving the CV
 */
export function storeTempCV(cv: CompleteCV): string {
  // Generate a unique ID
  const id = crypto.randomBytes(16).toString('hex');
  
  // Store the CV data with expiration (30 minutes)
  tempCVStorage.set(id, {
    cv,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60 * 1000
  });
  
  return id;
}

/**
 * Retrieve a temporarily stored CV by ID
 * @param id Unique ID of the CV
 * @returns The CV data or undefined if not found
 */
export function getTempCV(id: string): CompleteCV | undefined {
  const tempCV = tempCVStorage.get(id);
  
  if (!tempCV || tempCV.expiresAt < Date.now()) {
    // CV not found or expired
    tempCVStorage.delete(id);
    return undefined;
  }
  
  return tempCV.cv;
}

/**
 * Delete a temporarily stored CV by ID
 * @param id Unique ID of the CV to delete
 */
export function deleteTempCV(id: string): void {
  tempCVStorage.delete(id);
}

/**
 * Generates HTML for a CV based on template type
 * @param cv CV data
 * @returns HTML string of the rendered CV
 */
export function renderCVToHTML(cv: CompleteCV): string {
  const { templateSettings } = cv;
  const template = templateSettings?.template || 'professional';
  
  // Generate appropriate template
  switch (template) {
    case 'professional':
      return renderProfessionalTemplate(cv);
    case 'modern':
      return renderModernTemplate(cv);
    case 'minimal':
      return renderMinimalTemplate(cv);
    default:
      return renderProfessionalTemplate(cv);
  }
}

/**
 * Renders the Professional template
 */
function renderProfessionalTemplate(cv: CompleteCV): string {
  const { 
    personalInfo, 
    professionalSummary, 
    keyCompetencies, 
    experiences, 
    educations, 
    certificates,
    languages,
    extracurricular,
    additionalInfo,
    templateSettings
  } = cv;
  
  // Get section visibility and order
  const sectionOrder = templateSettings?.sectionOrder || [];
  const orderMap = new Map(sectionOrder.map(section => [section.id, section]));
  
  const getCSSClasses = (section: string) => {
    const sectionConfig = orderMap.get(section as any);
    if (!sectionConfig || !sectionConfig.visible) return 'hidden';
    return '';
  };
  
  // Base template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''} - CV</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
    }
    body {
      background-color: white;
      color: #333;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      width: 210mm; /* A4 width */
      height: 297mm; /* A4 height */
    }
    .container {
      padding: 20px;
      max-width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #03d27c;
      padding-bottom: 10px;
    }
    .name {
      font-size: 14pt;
      font-weight: bold;
      color: #043e44;
      margin-bottom: 5px;
    }
    .title {
      font-size: 11pt;
      color: #666;
      margin-bottom: 5px;
    }
    .contact-info {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 20px;
    }
    h2 {
      color: #043e44;
      border-bottom: 1px solid #03d27c;
      padding-bottom: 5px;
      margin-bottom: 10px;
      font-size: 12pt;
    }
    .summary {
      text-align: justify;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 3px;
    }
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    .skills-list {
      flex: 1;
      min-width: 200px;
    }
    .experience-item, .education-item, .certificate-item, .extracurricular-item {
      margin-bottom: 15px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .item-title {
      font-weight: bold;
      color: #043e44;
    }
    .item-subtitle {
      font-style: italic;
    }
    .item-date {
      color: #666;
    }
    .item-content {
      text-align: justify;
    }
    .language-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 15px;
      border: 2px solid #03d27c;
      display: ${templateSettings?.includePhoto && personalInfo?.photoUrl ? 'block' : 'none'};
    }
    @media print {
      body {
        width: 100%;
        height: auto;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${personalInfo?.photoUrl && templateSettings?.includePhoto ? 
        `<img src="${personalInfo.photoUrl}" alt="Profile Photo" class="photo" />` : ''}
      <div class="name">${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}</div>
      <div class="title">${personalInfo?.professionalTitle || ''}</div>
      <div class="contact-info">
        ${personalInfo?.email ? `<span>${personalInfo.email}</span>` : ''}
        ${personalInfo?.phone ? `<span>${personalInfo.phone}</span>` : ''}
        ${personalInfo?.linkedin ? `<span>${personalInfo.linkedin}</span>` : ''}
      </div>
    </div>
    
    <div class="section summary ${getCSSClasses('summary')}">
      <h2>Professional Summary</h2>
      <p>${professionalSummary?.summary || ''}</p>
    </div>
    
    <div class="section key-competencies ${getCSSClasses('keyCompetencies')}">
      <h2>Key Competencies</h2>
      <div class="skills-container">
        <div class="skills-list">
          <h3>Technical Skills</h3>
          <ul>
            ${keyCompetencies?.technicalSkills?.map(skill => `<li>${skill}</li>`).join('') || ''}
          </ul>
        </div>
        <div class="skills-list">
          <h3>Soft Skills</h3>
          <ul>
            ${keyCompetencies?.softSkills?.map(skill => `<li>${skill}</li>`).join('') || ''}
          </ul>
        </div>
      </div>
    </div>
    
    <div class="section experience ${getCSSClasses('experience')}">
      <h2>Professional Experience</h2>
      ${experiences?.map(exp => `
        <div class="experience-item">
          <div class="item-header">
            <div>
              <div class="item-title">${exp.jobTitle}</div>
              <div class="item-subtitle">${exp.companyName}</div>
            </div>
            <div class="item-date">
              ${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}
            </div>
          </div>
          <div class="item-content">
            ${exp.responsibilities}
          </div>
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section education ${getCSSClasses('education')}">
      <h2>Education</h2>
      ${educations?.map(edu => `
        <div class="education-item">
          <div class="item-header">
            <div>
              <div class="item-title">${edu.major}</div>
              <div class="item-subtitle">${edu.schoolName}</div>
            </div>
            <div class="item-date">
              ${edu.startDate} - ${edu.endDate || ''}
            </div>
          </div>
          ${edu.achievements ? `<div class="item-content">${edu.achievements}</div>` : ''}
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section certificates ${getCSSClasses('certificates')}">
      <h2>Certifications</h2>
      ${certificates?.map(cert => `
        <div class="certificate-item">
          <div class="item-header">
            <div>
              <div class="item-title">${cert.name}</div>
              <div class="item-subtitle">${cert.institution}</div>
            </div>
            <div class="item-date">
              ${cert.dateAcquired}${cert.expirationDate ? ` - ${cert.expirationDate}` : ''}
            </div>
          </div>
          ${cert.achievements ? `<div class="item-content">${cert.achievements}</div>` : ''}
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section languages ${getCSSClasses('additional')}">
      <h2>Languages</h2>
      ${languages?.map(lang => `
        <div class="language-item">
          <div class="language-name">${lang.name}</div>
          <div class="language-level">${lang.proficiency}</div>
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section extracurricular ${getCSSClasses('extracurricular')}">
      <h2>Extracurricular Activities</h2>
      ${extracurricular?.map(extra => `
        <div class="extracurricular-item">
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
            ${extra.description}
          </div>
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section additional-skills ${getCSSClasses('additional')}">
      <h2>Additional Skills</h2>
      <ul>
        ${additionalInfo?.skills?.map(skill => `<li>${skill}</li>`).join('') || ''}
      </ul>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders the Modern template
 */
function renderModernTemplate(cv: CompleteCV): string {
  const { 
    personalInfo, 
    professionalSummary, 
    keyCompetencies, 
    experiences, 
    educations, 
    certificates,
    languages,
    extracurricular,
    additionalInfo,
    templateSettings
  } = cv;
  
  // Get section visibility and order
  const sectionOrder = templateSettings?.sectionOrder || [];
  const orderMap = new Map(sectionOrder.map(section => [section.id, section]));
  
  const getCSSClasses = (section: string) => {
    const sectionConfig = orderMap.get(section as any);
    if (!sectionConfig || !sectionConfig.visible) return 'hidden';
    return '';
  };
  
  // Modern template with two-column layout
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''} - CV</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
    }
    body {
      background-color: white;
      color: #333;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      width: 210mm; /* A4 width */
      height: 297mm; /* A4 height */
    }
    .container {
      display: flex;
      min-height: 100%;
    }
    .sidebar {
      width: 30%;
      background-color: #f8f8f8;
      padding: 25px 15px;
      border-right: 1px solid #03d27c;
    }
    .main {
      width: 70%;
      padding: 25px;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
    }
    .name {
      font-size: 14pt;
      font-weight: bold;
      color: #043e44;
      margin-bottom: 5px;
    }
    .title {
      font-size: 11pt;
      color: #666;
      margin-bottom: 10px;
    }
    .contact-info {
      margin-top: 15px;
    }
    .contact-item {
      margin-bottom: 5px;
    }
    .section {
      margin-bottom: 20px;
    }
    h2 {
      color: #043e44;
      border-bottom: 2px solid #03d27c;
      padding-bottom: 5px;
      margin-bottom: 10px;
      font-size: 12pt;
    }
    .summary {
      text-align: justify;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 3px;
    }
    .experience-item, .education-item, .certificate-item, .extracurricular-item {
      margin-bottom: 15px;
    }
    .item-header {
      margin-bottom: 5px;
    }
    .item-title {
      font-weight: bold;
      color: #043e44;
    }
    .item-subtitle {
      font-style: italic;
    }
    .item-date {
      color: #666;
      font-size: 10pt;
      margin-bottom: 5px;
    }
    .item-content {
      text-align: justify;
    }
    .language-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5px;
    }
    .photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      margin: 0 auto 15px;
      border: 2px solid #03d27c;
      display: ${templateSettings?.includePhoto && personalInfo?.photoUrl ? 'block' : 'none'};
    }
    .hidden {
      display: none;
    }
    @media print {
      body {
        width: 100%;
        height: auto;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="header">
        ${personalInfo?.photoUrl && templateSettings?.includePhoto ? 
          `<img src="${personalInfo.photoUrl}" alt="Profile Photo" class="photo" />` : ''}
        <div class="name">${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}</div>
        <div class="title">${personalInfo?.professionalTitle || ''}</div>
      </div>
      
      <div class="section contact-info">
        <h2>Contact</h2>
        ${personalInfo?.email ? `<div class="contact-item">${personalInfo.email}</div>` : ''}
        ${personalInfo?.phone ? `<div class="contact-item">${personalInfo.phone}</div>` : ''}
        ${personalInfo?.linkedin ? `<div class="contact-item">${personalInfo.linkedin}</div>` : ''}
      </div>
      
      <div class="section languages ${getCSSClasses('additional')}">
        <h2>Languages</h2>
        ${languages?.map(lang => `
          <div class="language-item">
            <div class="language-name">${lang.name}</div>
            <div class="language-level">${lang.proficiency}</div>
          </div>
        `).join('') || ''}
      </div>
      
      <div class="section key-competencies ${getCSSClasses('keyCompetencies')}">
        <h2>Skills</h2>
        <div class="skills-grid">
          ${[...(keyCompetencies?.technicalSkills || []), ...(keyCompetencies?.softSkills || [])].map(skill => 
            `<div class="skill-item">${skill}</div>`).join('') || ''}
        </div>
      </div>
      
      <div class="section additional-skills ${getCSSClasses('additional')}">
        <h2>Additional Skills</h2>
        <ul>
          ${additionalInfo?.skills?.map(skill => `<li>${skill}</li>`).join('') || ''}
        </ul>
      </div>
    </div>
    
    <div class="main">
      <div class="section summary ${getCSSClasses('summary')}">
        <h2>Professional Summary</h2>
        <p>${professionalSummary?.summary || ''}</p>
      </div>
      
      <div class="section experience ${getCSSClasses('experience')}">
        <h2>Professional Experience</h2>
        ${experiences?.map(exp => `
          <div class="experience-item">
            <div class="item-header">
              <div class="item-title">${exp.jobTitle}</div>
              <div class="item-subtitle">${exp.companyName}</div>
              <div class="item-date">
                ${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}
              </div>
            </div>
            <div class="item-content">
              ${exp.responsibilities}
            </div>
          </div>
        `).join('') || ''}
      </div>
      
      <div class="section education ${getCSSClasses('education')}">
        <h2>Education</h2>
        ${educations?.map(edu => `
          <div class="education-item">
            <div class="item-header">
              <div class="item-title">${edu.major}</div>
              <div class="item-subtitle">${edu.schoolName}</div>
              <div class="item-date">
                ${edu.startDate} - ${edu.endDate || ''}
              </div>
            </div>
            ${edu.achievements ? `<div class="item-content">${edu.achievements}</div>` : ''}
          </div>
        `).join('') || ''}
      </div>
      
      <div class="section certificates ${getCSSClasses('certificates')}">
        <h2>Certifications</h2>
        ${certificates?.map(cert => `
          <div class="certificate-item">
            <div class="item-header">
              <div class="item-title">${cert.name}</div>
              <div class="item-subtitle">${cert.institution}</div>
              <div class="item-date">
                ${cert.dateAcquired}${cert.expirationDate ? ` - ${cert.expirationDate}` : ''}
              </div>
            </div>
            ${cert.achievements ? `<div class="item-content">${cert.achievements}</div>` : ''}
          </div>
        `).join('') || ''}
      </div>
      
      <div class="section extracurricular ${getCSSClasses('extracurricular')}">
        <h2>Extracurricular Activities</h2>
        ${extracurricular?.map(extra => `
          <div class="extracurricular-item">
            <div class="item-header">
              <div class="item-title">${extra.role}</div>
              <div class="item-subtitle">${extra.organization}</div>
              <div class="item-date">
                ${extra.startDate} - ${extra.isCurrent ? 'Present' : extra.endDate || ''}
              </div>
            </div>
            <div class="item-content">
              ${extra.description}
            </div>
          </div>
        `).join('') || ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Renders the Minimal template
 */
function renderMinimalTemplate(cv: CompleteCV): string {
  const { 
    personalInfo, 
    professionalSummary, 
    keyCompetencies, 
    experiences, 
    educations, 
    certificates,
    languages,
    extracurricular,
    additionalInfo,
    templateSettings
  } = cv;
  
  // Get section visibility and order
  const sectionOrder = templateSettings?.sectionOrder || [];
  const orderMap = new Map(sectionOrder.map(section => [section.id, section]));
  
  const getCSSClasses = (section: string) => {
    const sectionConfig = orderMap.get(section as any);
    if (!sectionConfig || !sectionConfig.visible) return 'hidden';
    return '';
  };
  
  // Minimal clean template
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''} - CV</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
    }
    body {
      background-color: white;
      color: #333;
      line-height: 1.5;
      padding: 0;
      margin: 0;
      width: 210mm; /* A4 width */
      height: 297mm; /* A4 height */
    }
    .container {
      padding: 25px;
      max-width: 100%;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 15px;
    }
    .header-left {
      flex: 3;
    }
    .header-right {
      flex: 1;
      text-align: right;
    }
    .name {
      font-size: 14pt;
      font-weight: bold;
      color: #043e44;
      margin-bottom: 5px;
    }
    .title {
      font-size: 11pt;
      color: #666;
      margin-bottom: 5px;
    }
    .contact-info {
      font-size: 10pt;
    }
    .contact-item {
      margin-bottom: 2px;
    }
    .section {
      margin-bottom: 25px;
    }
    h2 {
      color: #043e44;
      font-size: 12pt;
      margin-bottom: 10px;
      position: relative;
      display: inline-block;
    }
    h2:after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: #03d27c;
      bottom: -2px;
      left: 0;
    }
    .summary {
      text-align: justify;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 3px;
    }
    .experience-item, .education-item, .certificate-item, .extracurricular-item {
      margin-bottom: 15px;
      position: relative;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .item-title {
      font-weight: bold;
      color: #043e44;
    }
    .item-subtitle {
      font-style: italic;
    }
    .item-date {
      color: #666;
      text-align: right;
    }
    .item-content {
      text-align: justify;
    }
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .skill-item {
      background-color: #f8f8f8;
      padding: 3px 8px;
      border-radius: 3px;
      border: 1px solid #e0e0e0;
      font-size: 10pt;
    }
    .language-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 1px solid #ddd;
      display: ${templateSettings?.includePhoto && personalInfo?.photoUrl ? 'block' : 'none'};
    }
    .hidden {
      display: none;
    }
    @media print {
      body {
        width: 100%;
        height: auto;
      }
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-left">
        <div class="name">${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}</div>
        <div class="title">${personalInfo?.professionalTitle || ''}</div>
        <div class="contact-info">
          ${personalInfo?.email ? `<span class="contact-item">${personalInfo.email}</span> | ` : ''}
          ${personalInfo?.phone ? `<span class="contact-item">${personalInfo.phone}</span>` : ''}
          ${personalInfo?.linkedin ? `<span class="contact-item"> | ${personalInfo.linkedin}</span>` : ''}
        </div>
      </div>
      <div class="header-right">
        ${personalInfo?.photoUrl && templateSettings?.includePhoto ? 
          `<img src="${personalInfo.photoUrl}" alt="Profile Photo" class="photo" />` : ''}
      </div>
    </div>
    
    <div class="section summary ${getCSSClasses('summary')}">
      <h2>Professional Summary</h2>
      <p>${professionalSummary?.summary || ''}</p>
    </div>
    
    <div class="section key-competencies ${getCSSClasses('keyCompetencies')}">
      <h2>Key Competencies</h2>
      <div class="skills-grid">
        ${[...(keyCompetencies?.technicalSkills || []), ...(keyCompetencies?.softSkills || [])].map(skill => 
          `<div class="skill-item">${skill}</div>`).join('') || ''}
      </div>
    </div>
    
    <div class="section experience ${getCSSClasses('experience')}">
      <h2>Experience</h2>
      ${experiences?.map(exp => `
        <div class="experience-item">
          <div class="item-header">
            <div>
              <span class="item-title">${exp.jobTitle}</span> | 
              <span class="item-subtitle">${exp.companyName}</span>
            </div>
            <div class="item-date">
              ${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}
            </div>
          </div>
          <div class="item-content">
            ${exp.responsibilities}
          </div>
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section education ${getCSSClasses('education')}">
      <h2>Education</h2>
      ${educations?.map(edu => `
        <div class="education-item">
          <div class="item-header">
            <div>
              <span class="item-title">${edu.major}</span> | 
              <span class="item-subtitle">${edu.schoolName}</span>
            </div>
            <div class="item-date">
              ${edu.startDate} - ${edu.endDate || ''}
            </div>
          </div>
          ${edu.achievements ? `<div class="item-content">${edu.achievements}</div>` : ''}
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section certificates ${getCSSClasses('certificates')}">
      <h2>Certifications</h2>
      ${certificates?.map(cert => `
        <div class="certificate-item">
          <div class="item-header">
            <div>
              <span class="item-title">${cert.name}</span> | 
              <span class="item-subtitle">${cert.institution}</span>
            </div>
            <div class="item-date">
              ${cert.dateAcquired}${cert.expirationDate ? ` - ${cert.expirationDate}` : ''}
            </div>
          </div>
          ${cert.achievements ? `<div class="item-content">${cert.achievements}</div>` : ''}
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section languages ${getCSSClasses('additional')}">
      <h2>Languages</h2>
      <div class="skills-grid">
        ${languages?.map(lang => `
          <div class="skill-item">${lang.name} - ${lang.proficiency}</div>
        `).join('') || ''}
      </div>
    </div>
    
    <div class="section extracurricular ${getCSSClasses('extracurricular')}">
      <h2>Extracurricular Activities</h2>
      ${extracurricular?.map(extra => `
        <div class="extracurricular-item">
          <div class="item-header">
            <div>
              <span class="item-title">${extra.role}</span> | 
              <span class="item-subtitle">${extra.organization}</span>
            </div>
            <div class="item-date">
              ${extra.startDate} - ${extra.isCurrent ? 'Present' : extra.endDate || ''}
            </div>
          </div>
          <div class="item-content">
            ${extra.description}
          </div>
        </div>
      `).join('') || ''}
    </div>
    
    <div class="section additional-skills ${getCSSClasses('additional')}">
      <h2>Additional Skills</h2>
      <div class="skills-grid">
        ${additionalInfo?.skills?.map(skill => `<div class="skill-item">${skill}</div>`).join('') || ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}