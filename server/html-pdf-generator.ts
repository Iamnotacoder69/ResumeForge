import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { CompleteCV, TemplateType, SectionOrder } from '@shared/types';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Handlebars helpers
Handlebars.registerHelper('formatDate', function(dateString: string) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch (e) {
    return dateString;
  }
});

Handlebars.registerHelper('ifCond', function(this: any, v1: any, operator: string, v2: any, options: any) {
  switch (operator) {
    case '==':
      return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!=':
      return (v1 != v2) ? options.fn(this) : options.inverse(this);
    case '!==':
      return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    case '<':
      return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=':
      return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>':
      return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=':
      return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    case '&&':
      return (v1 && v2) ? options.fn(this) : options.inverse(this);
    case '||':
      return (v1 || v2) ? options.fn(this) : options.inverse(this);
    default:
      return options.inverse(this);
  }
});

Handlebars.registerHelper('capitalize', function(this: any, str: string) {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, '../templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Professional template
const professionalTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CV - {{personal.firstName}} {{personal.lastName}}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .cv-container {
      padding: 20mm;
      box-sizing: border-box;
      position: relative;
    }
    .header {
      margin-bottom: 5mm;
    }
    .name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .contact-info {
      font-size: 11pt;
      color: #555;
      margin-bottom: 3mm;
    }
    .section {
      margin-bottom: 7mm; /* 7 units spacing between sections */
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #304878;
      margin-bottom: 3mm;
      padding-bottom: 1mm;
      border-bottom: 1px solid #ddd;
    }
    .entry {
      margin-bottom: 5mm; /* 5 units spacing between entries */
    }
    .entry:last-child {
      margin-bottom: 0; /* No margin after last entry */
    }
    .entry-header {
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .entry-subheader {
      font-weight: normal;
      font-style: italic;
      color: #555;
      margin-bottom: 2mm;
    }
    .entry-content {
      margin-top: 1mm;
    }
    .skills-list, .languages-list {
      margin-top: 1mm;
      margin-bottom: 0;
    }
    .with-photo .contact-info {
      max-width: 70%;
    }
    .photo {
      position: absolute;
      top: 20mm;
      right: 20mm;
      width: 40mm;
      height: 40mm;
      object-fit: cover;
    }
    .divider {
      height: 1px;
      background-color: #ddd;
      margin: 2mm 0 5mm 0;
    }
    .subsection {
      margin-top: 3mm;
      margin-bottom: 3mm;
    }
    .subsection-title {
      font-weight: bold;
      margin-bottom: 1mm;
    }
  </style>
</head>
<body>
  <div class="cv-container {{#if personal.photoUrl}}with-photo{{/if}}">
    <!-- Header -->
    <div class="header">
      <div class="name">{{personal.firstName}} {{personal.lastName}}</div>
      <div class="contact-info">
        Email: {{personal.email}} | Phone: {{personal.phone}}
        {{#if personal.linkedin}}<br>LinkedIn: linkedin.com/in/{{personal.linkedin}}{{/if}}
      </div>
      {{#if personal.photoUrl}}
      <img class="photo" src="{{personal.photoUrl}}" alt="Profile Photo">
      {{/if}}
    </div>
    
    <div class="divider"></div>
    
    <!-- Sections based on order -->
    {{#each sections}}
      {{#ifCond id "===" "summary"}}
        {{#if ../professional.summary}}
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="entry-content">{{../professional.summary}}</div>
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "keyCompetencies"}}
        {{#if ../keyCompetencies}}
        <div class="section">
          <div class="section-title">Key Competencies</div>
          {{#if ../keyCompetencies.technicalSkills}}
          <div class="subsection">
            <div class="subsection-title">Technical Skills</div>
            <div class="skills-list">{{../keyCompetencies.technicalSkills}}</div>
          </div>
          {{/if}}
          {{#if ../keyCompetencies.softSkills}}
          <div class="subsection">
            <div class="subsection-title">Soft Skills</div>
            <div class="skills-list">{{../keyCompetencies.softSkills}}</div>
          </div>
          {{/if}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "experience"}}
        {{#if ../experience.length}}
        <div class="section">
          <div class="section-title">Professional Experience</div>
          {{#each ../experience}}
          <div class="entry">
            <div class="entry-header">{{jobTitle}}</div>
            <div class="entry-subheader">
              {{companyName}} | {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
            {{#if responsibilities}}
            <div class="entry-content">{{responsibilities}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "education"}}
        {{#if ../education.length}}
        <div class="section">
          <div class="section-title">Education</div>
          {{#each ../education}}
          <div class="entry">
            <div class="entry-header">{{major}}</div>
            <div class="entry-subheader">
              {{schoolName}} | {{formatDate startDate}} - {{formatDate endDate}}
            </div>
            {{#if achievements}}
            <div class="entry-content">{{achievements}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "certificates"}}
        {{#if ../certificates.length}}
        <div class="section">
          <div class="section-title">Certificates</div>
          {{#each ../certificates}}
          <div class="entry">
            <div class="entry-header">{{name}}</div>
            <div class="entry-subheader">
              {{institution}} | {{formatDate dateAcquired}}{{#if expirationDate}} (Expires: {{formatDate expirationDate}}){{/if}}
            </div>
            {{#if achievements}}
            <div class="entry-content">{{achievements}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "extracurricular"}}
        {{#if ../extracurricular.length}}
        <div class="section">
          <div class="section-title">Extracurricular Activities</div>
          {{#each ../extracurricular}}
          <div class="entry">
            <div class="entry-header">{{role}}</div>
            <div class="entry-subheader">
              {{organization}} | {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
            {{#if description}}
            <div class="entry-content">{{description}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "additional"}}
        <div class="section">
          <div class="section-title">Additional Information</div>
          {{#if ../additional.skills.length}}
          <div class="subsection">
            <div class="subsection-title">Computer Skills</div>
            <div class="skills-list">{{../additional.skills}}</div>
          </div>
          {{/if}}
          
          {{#if ../languages.length}}
          <div class="subsection">
            <div class="subsection-title">Languages</div>
            <div class="languages-list">
              {{#each ../languages}}
                {{name}} ({{capitalize proficiency}}){{#unless @last}}, {{/unless}}
              {{/each}}
            </div>
          </div>
          {{/if}}
        </div>
      {{/ifCond}}
    {{/each}}
  </div>
</body>
</html>
`;

// Modern Sidebar template
const modernSidebarTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CV - {{personal.firstName}} {{personal.lastName}}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .cv-container {
      display: flex;
      min-height: 100%;
    }
    .sidebar {
      width: 60mm;
      background-color: #f0c869;
      padding: 20mm 10mm;
      color: #333;
    }
    .main-content {
      flex: 1;
      padding: 20mm;
    }
    .profile-photo {
      width: 40mm;
      height: 40mm;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 5mm;
    }
    .name {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .sidebar-section {
      margin-bottom: 5mm;
    }
    .sidebar-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2mm;
      font-size: 10pt;
    }
    .sidebar-content {
      font-size: 10pt;
    }
    .section {
      margin-bottom: 7mm; /* 7 units spacing between sections */
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 3mm;
      text-transform: uppercase;
    }
    .entry {
      margin-bottom: 5mm; /* 5 units spacing between entries */
    }
    .entry:last-child {
      margin-bottom: 0; /* No margin after last entry */
    }
    .entry-header {
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .entry-subheader {
      font-weight: normal;
      font-style: italic;
      color: #555;
      margin-bottom: 2mm;
    }
    .entry-content {
      margin-top: 1mm;
    }
    .dot-accent {
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #f0c869;
      border-radius: 50%;
      margin-right: 5px;
      vertical-align: middle;
    }
    .skills-list, .languages-list {
      margin-top: 1mm;
      margin-bottom: 0;
    }
    .subsection {
      margin-top: 3mm;
      margin-bottom: 3mm;
    }
    .subsection-title {
      font-weight: bold;
      margin-bottom: 1mm;
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <!-- Sidebar -->
    <div class="sidebar">
      {{#if personal.photoUrl}}
      <img class="profile-photo" src="{{personal.photoUrl}}" alt="Profile Photo">
      {{/if}}
      
      <div class="name">{{personal.firstName}} {{personal.lastName}}</div>
      
      <div class="sidebar-section">
        <div class="sidebar-title">Contact</div>
        <div class="sidebar-content">
          Email: {{personal.email}}<br>
          Phone: {{personal.phone}}<br>
          {{#if personal.linkedin}}LinkedIn: linkedin.com/in/{{personal.linkedin}}{{/if}}
        </div>
      </div>
      
      {{#if languages.length}}
      <div class="sidebar-section">
        <div class="sidebar-title">Languages</div>
        <div class="sidebar-content">
          {{#each languages}}
          {{name}} ({{capitalize proficiency}}){{#unless @last}}<br>{{/unless}}
          {{/each}}
        </div>
      </div>
      {{/if}}
      
      {{#if additional.skills.length}}
      <div class="sidebar-section">
        <div class="sidebar-title">Computer Skills</div>
        <div class="sidebar-content">{{additional.skills}}</div>
      </div>
      {{/if}}
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <!-- Sections based on order -->
      {{#each sections}}
        {{#ifCond id "===" "summary"}}
          {{#if ../professional.summary}}
          <div class="section">
            <div class="section-title">Professional Summary</div>
            <div class="entry-content">{{../professional.summary}}</div>
          </div>
          {{/if}}
        {{/ifCond}}
        
        {{#ifCond id "===" "keyCompetencies"}}
          {{#if ../keyCompetencies}}
          <div class="section">
            <div class="section-title">Key Competencies</div>
            {{#if ../keyCompetencies.technicalSkills}}
            <div class="subsection">
              <div class="entry-header"><span class="dot-accent"></span>Technical Skills</div>
              <div class="skills-list">{{../keyCompetencies.technicalSkills}}</div>
            </div>
            {{/if}}
            {{#if ../keyCompetencies.softSkills}}
            <div class="subsection">
              <div class="entry-header"><span class="dot-accent"></span>Soft Skills</div>
              <div class="skills-list">{{../keyCompetencies.softSkills}}</div>
            </div>
            {{/if}}
          </div>
          {{/if}}
        {{/ifCond}}
        
        {{#ifCond id "===" "experience"}}
          {{#if ../experience.length}}
          <div class="section">
            <div class="section-title">Work Experience</div>
            {{#each ../experience}}
            <div class="entry">
              <div class="entry-header"><span class="dot-accent"></span>{{jobTitle}}</div>
              <div class="entry-subheader">
                {{companyName}} | {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
              </div>
              {{#if responsibilities}}
              <div class="entry-content">{{responsibilities}}</div>
              {{/if}}
            </div>
            {{/each}}
          </div>
          {{/if}}
        {{/ifCond}}
        
        {{#ifCond id "===" "education"}}
          {{#if ../education.length}}
          <div class="section">
            <div class="section-title">Education</div>
            {{#each ../education}}
            <div class="entry">
              <div class="entry-header"><span class="dot-accent"></span>{{major}}</div>
              <div class="entry-subheader">
                {{schoolName}} | {{formatDate startDate}} - {{formatDate endDate}}
              </div>
              {{#if achievements}}
              <div class="entry-content">{{achievements}}</div>
              {{/if}}
            </div>
            {{/each}}
          </div>
          {{/if}}
        {{/ifCond}}
        
        {{#ifCond id "===" "certificates"}}
          {{#if ../certificates.length}}
          <div class="section">
            <div class="section-title">Certificates</div>
            {{#each ../certificates}}
            <div class="entry">
              <div class="entry-header"><span class="dot-accent"></span>{{name}}</div>
              <div class="entry-subheader">
                {{institution}} | {{formatDate dateAcquired}}{{#if expirationDate}} (Expires: {{formatDate expirationDate}}){{/if}}
              </div>
              {{#if achievements}}
              <div class="entry-content">{{achievements}}</div>
              {{/if}}
            </div>
            {{/each}}
          </div>
          {{/if}}
        {{/ifCond}}
        
        {{#ifCond id "===" "extracurricular"}}
          {{#if ../extracurricular.length}}
          <div class="section">
            <div class="section-title">Extracurricular</div>
            {{#each ../extracurricular}}
            <div class="entry">
              <div class="entry-header"><span class="dot-accent"></span>{{role}}</div>
              <div class="entry-subheader">
                {{organization}} | {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
              </div>
              {{#if description}}
              <div class="entry-content">{{description}}</div>
              {{/if}}
            </div>
            {{/each}}
          </div>
          {{/if}}
        {{/ifCond}}
      {{/each}}
    </div>
  </div>
</body>
</html>
`;

// Academic template
const academicTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CV - {{personal.firstName}} {{personal.lastName}}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.5;
      margin: 0;
      padding: 0;
    }
    .cv-container {
      padding: 20mm;
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      margin-bottom: 5mm;
    }
    .name {
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .contact-info {
      font-size: 11pt;
      margin-bottom: 3mm;
    }
    .section {
      margin-bottom: 7mm; /* 7 units spacing between sections */
    }
    .section-title {
      font-size: 12pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 3mm;
      border-bottom: 1px solid #000;
      padding-bottom: 1mm;
    }
    .entry {
      margin-bottom: 5mm; /* 5 units spacing between entries */
    }
    .entry:last-child {
      margin-bottom: 0; /* No margin after last entry */
    }
    .entry-header {
      font-weight: bold;
      margin-bottom: 1mm;
    }
    .entry-subheader {
      font-style: italic;
      margin-bottom: 2mm;
    }
    .entry-content {
      margin-top: 1mm;
      text-align: justify;
    }
    .skills-list, .languages-list {
      margin-top: 1mm;
      margin-bottom: 0;
    }
    .with-photo .header {
      position: relative;
      min-height: 40mm;
    }
    .photo {
      position: absolute;
      top: 0;
      right: 0;
      width: 40mm;
      height: 40mm;
      object-fit: cover;
    }
    .with-photo .contact-info {
      text-align: left;
      margin-right: 45mm;
    }
    .subsection {
      margin-top: 3mm;
      margin-bottom: 3mm;
    }
    .subsection-title {
      font-weight: bold;
      font-style: italic;
      margin-bottom: 1mm;
    }
  </style>
</head>
<body>
  <div class="cv-container {{#if personal.photoUrl}}with-photo{{/if}}">
    <!-- Header -->
    <div class="header">
      <div class="name">{{personal.firstName}} {{personal.lastName}}</div>
      <div class="contact-info">
        Email: {{personal.email}} | Phone: {{personal.phone}}
        {{#if personal.linkedin}}<br>LinkedIn: linkedin.com/in/{{personal.linkedin}}{{/if}}
      </div>
      {{#if personal.photoUrl}}
      <img class="photo" src="{{personal.photoUrl}}" alt="Profile Photo">
      {{/if}}
    </div>
    
    <!-- Sections based on order -->
    {{#each sections}}
      {{#ifCond id "===" "summary"}}
        {{#if ../professional.summary}}
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="entry-content">{{../professional.summary}}</div>
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "keyCompetencies"}}
        {{#if ../keyCompetencies}}
        <div class="section">
          <div class="section-title">Key Competencies</div>
          {{#if ../keyCompetencies.technicalSkills}}
          <div class="subsection">
            <div class="subsection-title">Technical Skills</div>
            <div class="skills-list">{{../keyCompetencies.technicalSkills}}</div>
          </div>
          {{/if}}
          {{#if ../keyCompetencies.softSkills}}
          <div class="subsection">
            <div class="subsection-title">Soft Skills</div>
            <div class="skills-list">{{../keyCompetencies.softSkills}}</div>
          </div>
          {{/if}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "experience"}}
        {{#if ../experience.length}}
        <div class="section">
          <div class="section-title">Professional Experience</div>
          {{#each ../experience}}
          <div class="entry">
            <div class="entry-header">{{jobTitle}}</div>
            <div class="entry-subheader">
              {{companyName}}, {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
            {{#if responsibilities}}
            <div class="entry-content">{{responsibilities}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "education"}}
        {{#if ../education.length}}
        <div class="section">
          <div class="section-title">Education</div>
          {{#each ../education}}
          <div class="entry">
            <div class="entry-header">{{major}}</div>
            <div class="entry-subheader">
              {{schoolName}}, {{formatDate startDate}} - {{formatDate endDate}}
            </div>
            {{#if achievements}}
            <div class="entry-content">{{achievements}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "certificates"}}
        {{#if ../certificates.length}}
        <div class="section">
          <div class="section-title">Certificates</div>
          {{#each ../certificates}}
          <div class="entry">
            <div class="entry-header">{{name}}</div>
            <div class="entry-subheader">
              {{institution}}, {{formatDate dateAcquired}}{{#if expirationDate}} (Expires: {{formatDate expirationDate}}){{/if}}
            </div>
            {{#if achievements}}
            <div class="entry-content">{{achievements}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "extracurricular"}}
        {{#if ../extracurricular.length}}
        <div class="section">
          <div class="section-title">Extracurricular Activities</div>
          {{#each ../extracurricular}}
          <div class="entry">
            <div class="entry-header">{{role}}</div>
            <div class="entry-subheader">
              {{organization}}, {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
            {{#if description}}
            <div class="entry-content">{{description}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "additional"}}
        <div class="section">
          <div class="section-title">Additional Information</div>
          {{#if ../additional.skills.length}}
          <div class="subsection">
            <div class="subsection-title">Computer Skills</div>
            <div class="skills-list">{{../additional.skills}}</div>
          </div>
          {{/if}}
          
          {{#if ../languages.length}}
          <div class="subsection">
            <div class="subsection-title">Languages</div>
            <div class="languages-list">
              {{#each ../languages}}
                {{name}} ({{capitalize proficiency}}){{#unless @last}}, {{/unless}}
              {{/each}}
            </div>
          </div>
          {{/if}}
        </div>
      {{/ifCond}}
    {{/each}}
  </div>
</body>
</html>
`;

// Creative template
const creativeTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CV - {{personal.firstName}} {{personal.lastName}}</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      color: #333;
      line-height: 1.4;
      margin: 0;
      padding: 0;
      background-color: #fff;
    }
    .cv-container {
      padding: 20mm;
      box-sizing: border-box;
      position: relative;
    }
    .header {
      margin-bottom: 10mm;
      position: relative;
    }
    .name {
      font-size: 20pt;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 3mm;
      letter-spacing: 1px;
    }
    .contact-info {
      font-size: 11pt;
      color: #7f8c8d;
      margin-bottom: 3mm;
    }
    .section {
      margin-bottom: 7mm; /* 7 units spacing between sections */
      position: relative;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 3mm;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .section-title::after {
      content: '';
      display: block;
      width: 30mm;
      height: 1mm;
      background-color: #3498db;
      margin-top: 1mm;
    }
    .entry {
      margin-bottom: 5mm; /* 5 units spacing between entries */
      padding-left: 10mm;
      position: relative;
    }
    .entry:last-child {
      margin-bottom: 0; /* No margin after last entry */
    }
    .entry::before {
      content: '';
      position: absolute;
      left: 0;
      top: 3mm;
      width: 2mm;
      height: 2mm;
      background-color: #3498db;
      border-radius: 50%;
    }
    .entry-header {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 1mm;
    }
    .entry-subheader {
      font-style: italic;
      color: #7f8c8d;
      margin-bottom: 2mm;
    }
    .entry-content {
      margin-top: 1mm;
    }
    .skills-list, .languages-list {
      margin-top: 1mm;
      margin-bottom: 0;
    }
    .photo {
      position: absolute;
      top: 20mm;
      right: 20mm;
      width: 40mm;
      height: 40mm;
      border-radius: 5mm;
      object-fit: cover;
      box-shadow: 0 3mm 6mm rgba(0,0,0,0.1);
    }
    .with-photo .header {
      padding-right: 45mm;
    }
    .subsection {
      margin-top: 3mm;
      margin-bottom: 3mm;
    }
    .subsection-title {
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 1mm;
    }
  </style>
</head>
<body>
  <div class="cv-container {{#if personal.photoUrl}}with-photo{{/if}}">
    <!-- Header -->
    <div class="header">
      <div class="name">{{personal.firstName}} {{personal.lastName}}</div>
      <div class="contact-info">
        Email: {{personal.email}} | Phone: {{personal.phone}}
        {{#if personal.linkedin}}<br>LinkedIn: linkedin.com/in/{{personal.linkedin}}{{/if}}
      </div>
      {{#if personal.photoUrl}}
      <img class="photo" src="{{personal.photoUrl}}" alt="Profile Photo">
      {{/if}}
    </div>
    
    <!-- Sections based on order -->
    {{#each sections}}
      {{#ifCond id "===" "summary"}}
        {{#if ../professional.summary}}
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="entry-content">{{../professional.summary}}</div>
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "keyCompetencies"}}
        {{#if ../keyCompetencies}}
        <div class="section">
          <div class="section-title">Key Competencies</div>
          {{#if ../keyCompetencies.technicalSkills}}
          <div class="subsection">
            <div class="subsection-title">Technical Skills</div>
            <div class="skills-list">{{../keyCompetencies.technicalSkills}}</div>
          </div>
          {{/if}}
          {{#if ../keyCompetencies.softSkills}}
          <div class="subsection">
            <div class="subsection-title">Soft Skills</div>
            <div class="skills-list">{{../keyCompetencies.softSkills}}</div>
          </div>
          {{/if}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "experience"}}
        {{#if ../experience.length}}
        <div class="section">
          <div class="section-title">Work Experience</div>
          {{#each ../experience}}
          <div class="entry">
            <div class="entry-header">{{jobTitle}}</div>
            <div class="entry-subheader">
              {{companyName}} | {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
            {{#if responsibilities}}
            <div class="entry-content">{{responsibilities}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "education"}}
        {{#if ../education.length}}
        <div class="section">
          <div class="section-title">Education</div>
          {{#each ../education}}
          <div class="entry">
            <div class="entry-header">{{major}}</div>
            <div class="entry-subheader">
              {{schoolName}} | {{formatDate startDate}} - {{formatDate endDate}}
            </div>
            {{#if achievements}}
            <div class="entry-content">{{achievements}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "certificates"}}
        {{#if ../certificates.length}}
        <div class="section">
          <div class="section-title">Certificates</div>
          {{#each ../certificates}}
          <div class="entry">
            <div class="entry-header">{{name}}</div>
            <div class="entry-subheader">
              {{institution}} | {{formatDate dateAcquired}}{{#if expirationDate}} (Expires: {{formatDate expirationDate}}){{/if}}
            </div>
            {{#if achievements}}
            <div class="entry-content">{{achievements}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "extracurricular"}}
        {{#if ../extracurricular.length}}
        <div class="section">
          <div class="section-title">Extracurricular Activities</div>
          {{#each ../extracurricular}}
          <div class="entry">
            <div class="entry-header">{{role}}</div>
            <div class="entry-subheader">
              {{organization}} | {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
            {{#if description}}
            <div class="entry-content">{{description}}</div>
            {{/if}}
          </div>
          {{/each}}
        </div>
        {{/if}}
      {{/ifCond}}
      
      {{#ifCond id "===" "additional"}}
        <div class="section">
          <div class="section-title">Additional Information</div>
          {{#if ../additional.skills.length}}
          <div class="subsection">
            <div class="subsection-title">Computer Skills</div>
            <div class="skills-list">{{../additional.skills}}</div>
          </div>
          {{/if}}
          
          {{#if ../languages.length}}
          <div class="subsection">
            <div class="subsection-title">Languages</div>
            <div class="languages-list">
              {{#each ../languages}}
                {{name}} ({{capitalize proficiency}}){{#unless @last}}, {{/unless}}
              {{/each}}
            </div>
          </div>
          {{/if}}
        </div>
      {{/ifCond}}
    {{/each}}
  </div>
</body>
</html>
`;

// Save templates to files
fs.writeFileSync(path.join(templatesDir, 'professional.hbs'), professionalTemplate);
fs.writeFileSync(path.join(templatesDir, 'modern-sidebar.hbs'), modernSidebarTemplate);
fs.writeFileSync(path.join(templatesDir, 'academic.hbs'), academicTemplate);
fs.writeFileSync(path.join(templatesDir, 'creative.hbs'), creativeTemplate);

/**
 * Generates a PDF document from CV data using HTML templates and Puppeteer
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
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
  
  // If no template matches, default to professional
  let templatePath: string;
  // Handle template selection, ensuring type compatibility
  const templateToUse = (templateType === 'minimalist' ? 'professional' : templateType) as 'professional' | 'creative' | 'academic' | 'modern-sidebar';
  
  switch (templateToUse) {
    case 'modern-sidebar':
      templatePath = path.join(templatesDir, 'modern-sidebar.hbs');
      break;
    case 'academic':
      templatePath = path.join(templatesDir, 'academic.hbs');
      break;
    case 'creative':
      templatePath = path.join(templatesDir, 'creative.hbs');
      break;
    case 'professional':
    default:
      templatePath = path.join(templatesDir, 'professional.hbs');
      break;
  }
  
  // Get template
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  
  // Compile template
  const template = Handlebars.compile(templateSource);
  
  // Generate HTML content
  const htmlContent = template({
    ...data,
    sections: sectionOrder
  });
  
  // Generate PDF with Puppeteer
  const tempHtmlPath = path.join('/tmp', `cv-${randomUUID()}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent);
  
  // Create a temporary directory for puppeteer to use
  const tmpDir = path.join('/tmp', `puppeteer-${randomUUID()}`);
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  try {
    console.log('PDF Generation - Launching Puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        `--user-data-dir=${tmpDir}`
      ]
    });
    
    const page = await browser.newPage();
    
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0' });
    
    // Set A4 paper size
    await page.emulateMediaType('print');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });
    
    await browser.close();
    console.log('PDF Generation - PDF created successfully');
    
    // Clean up temporary files
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
    
    console.log(`PDF Generation - PDF buffer created, size: ${pdfBuffer.length}`);
    return Buffer.from(pdfBuffer);
  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  } finally {
    // Clean up temp files
    try {
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    } catch (e) {
      console.error('Error cleaning up temporary files:', e);
    }
  }
}