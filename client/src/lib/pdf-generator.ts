import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Handlebars from 'handlebars';
import { registerHelpers } from './handlebars-helpers';
import { CompleteCV, TemplateType } from '@shared/types';

// Register all Handlebars helpers
registerHelpers();

// Load template content
const professionalTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{personal.firstName}} {{personal.lastName}} - CV</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
    
    body {
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      background-color: white;
    }
    
    .cv-container {
      max-width: 21cm;
      margin: 0 auto;
      padding: 25mm 20mm;
      background-color: white;
    }
    
    .header {
      border-bottom: 2px solid #03d27c;
      padding-bottom: 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .profile-info {
      width: 100%;
    }
    
    .profile-photo {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #03d27c;
    }
    
    .name {
      font-size: 22pt;
      font-weight: 700;
      color: #043e44;
      margin-bottom: 5px;
    }
    
    .professional-title {
      font-size: 14pt;
      font-weight: 500;
      color: #03d27c;
      margin-bottom: 10px;
    }
    
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 9pt;
      margin-top: 10px;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      margin-right: 15px;
    }
    
    .section {
      margin-bottom: 20px;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: 600;
      color: #043e44;
      margin-bottom: 10px;
      border-bottom: 1px solid #03d27c;
      padding-bottom: 5px;
    }
    
    .summary {
      text-align: justify;
      margin-bottom: 20px;
    }
    
    .key-competencies {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .skills-column {
      flex: 1;
    }
    
    .skills-title {
      font-weight: 600;
      margin-bottom: 5px;
      color: #03d27c;
    }
    
    .skills-list {
      list-style-type: none;
      padding-left: 0;
    }
    
    .skills-list li {
      position: relative;
      padding-left: 15px;
      margin-bottom: 3px;
    }
    
    .skills-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #03d27c;
    }
    
    .experience-item, .education-item, .certificate-item, .extracurricular-item {
      margin-bottom: 15px;
    }
    
    .item-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .company-name, .school-name, .institution-name, .organization-name {
      font-weight: 600;
      color: #043e44;
    }
    
    .job-title, .major, .certificate-name, .role {
      font-weight: 500;
      color: #03d27c;
    }
    
    .date-range {
      font-style: italic;
      font-size: 9pt;
      color: #666;
    }
    
    .responsibilities, .achievements, .description {
      text-align: justify;
      padding-left: 15px;
    }
    
    .language-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }
    
    .language-item {
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 5px 10px;
    }
    
    .language-name {
      font-weight: 500;
      margin-right: 5px;
    }
    
    .language-proficiency {
      color: #666;
      font-size: 9pt;
    }
    
    .additional-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    
    .skill-pill {
      background-color: #f5f5f5;
      border: 1px solid #03d27c;
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 9pt;
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <header class="header">
      <div class="profile-info">
        <h1 class="name">{{personal.firstName}} {{personal.lastName}}</h1>
        <div class="professional-title">{{personal.professionalTitle}}</div>
        <div class="contact-info">
          <div class="contact-item">
            <span>{{personal.email}}</span>
          </div>
          <div class="contact-item">
            <span>{{personal.phone}}</span>
          </div>
          {{#if personal.linkedin}}
          <div class="contact-item">
            <span>linkedin.com/in/{{personal.linkedin}}</span>
          </div>
          {{/if}}
        </div>
      </div>
      {{#if personal.photoUrl}}
      {{#if templateSettings.includePhoto}}
      <img src="{{personal.photoUrl}}" alt="Profile Photo" class="profile-photo">
      {{/if}}
      {{/if}}
    </header>
    
    {{#each templateSettings.sectionOrder as |section|}}
    {{#if section.visible}}
    
    {{#if (eq section.id "summary")}}
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <div class="summary">
        {{../professional.summary}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "keyCompetencies")}}
    <section class="section">
      <h2 class="section-title">Key Competencies</h2>
      <div class="key-competencies">
        {{#if ../keyCompetencies.technicalSkills.length}}
        <div class="skills-column">
          <h3 class="skills-title">Technical Skills</h3>
          <ul class="skills-list">
            {{#each ../keyCompetencies.technicalSkills}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
        
        {{#if ../keyCompetencies.softSkills.length}}
        <div class="skills-column">
          <h3 class="skills-title">Soft Skills</h3>
          <ul class="skills-list">
            {{#each ../keyCompetencies.softSkills}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "experience")}}
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      {{#each ../experience}}
      <div class="experience-item">
        <div class="item-header">
          <div>
            <div class="company-name">{{companyName}}</div>
            <div class="job-title">{{jobTitle}}</div>
          </div>
          <div class="date-range">
            {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
          </div>
        </div>
        <div class="responsibilities">
          {{responsibilities}}
        </div>
      </div>
      {{/each}}
    </section>
    {{/if}}
    
    {{#if (eq section.id "education")}}
    <section class="section">
      <h2 class="section-title">Education</h2>
      {{#each ../education}}
      <div class="education-item">
        <div class="item-header">
          <div>
            <div class="school-name">{{schoolName}}</div>
            <div class="major">{{major}}</div>
          </div>
          <div class="date-range">
            {{formatDate startDate}} - {{formatDate endDate}}
          </div>
        </div>
        {{#if achievements}}
        <div class="achievements">
          {{achievements}}
        </div>
        {{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}
    
    {{#if (eq section.id "certificates")}}
    <section class="section">
      <h2 class="section-title">Certifications</h2>
      {{#each ../certificates}}
      <div class="certificate-item">
        <div class="item-header">
          <div>
            <div class="institution-name">{{institution}}</div>
            <div class="certificate-name">{{name}}</div>
          </div>
          <div class="date-range">
            {{formatDate dateAcquired}}{{#if expirationDate}} - {{formatDate expirationDate}}{{/if}}
          </div>
        </div>
        {{#if achievements}}
        <div class="achievements">
          {{achievements}}
        </div>
        {{/if}}
      </div>
      {{/each}}
    </section>
    {{/if}}
    
    {{#if (eq section.id "extracurricular")}}
    <section class="section">
      <h2 class="section-title">Extracurricular Activities</h2>
      {{#each ../extracurricular}}
      <div class="extracurricular-item">
        <div class="item-header">
          <div>
            <div class="organization-name">{{organization}}</div>
            <div class="role">{{role}}</div>
          </div>
          <div class="date-range">
            {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
          </div>
        </div>
        <div class="description">
          {{description}}
        </div>
      </div>
      {{/each}}
    </section>
    {{/if}}
    
    {{#if (eq section.id "additional")}}
    <section class="section">
      <h2 class="section-title">Additional Skills</h2>
      {{#if ../languages.length}}
      <div>
        <h3 class="skills-title">Languages</h3>
        <div class="language-list">
          {{#each ../languages}}
          <div class="language-item">
            <span class="language-name">{{name}}</span>
            <span class="language-proficiency">({{proficiency}})</span>
          </div>
          {{/each}}
        </div>
      </div>
      {{/if}}
      
      {{#if ../additional.skills.length}}
      <div class="mt-4">
        <h3 class="skills-title">Other Skills</h3>
        <div class="additional-skills">
          {{#each ../additional.skills}}
          <span class="skill-pill">{{this}}</span>
          {{/each}}
        </div>
      </div>
      {{/if}}
    </section>
    {{/if}}
    
    {{/if}}
    {{/each}}
  </div>
</body>
</html>`;

const modernTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{personal.firstName}} {{personal.lastName}} - CV</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
    
    body {
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      background-color: white;
    }
    
    .cv-container {
      max-width: 21cm;
      margin: 0 auto;
      padding: 0;
      background-color: white;
      position: relative;
    }
    
    .header {
      background-color: #03d27c;
      color: white;
      padding: 25px 30px;
      position: relative;
    }
    
    .name {
      font-size: 22pt;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .professional-title {
      font-size: 14pt;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 15px;
    }
    
    .contact-info {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      font-size: 9pt;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
    }
    
    .profile-column {
      float: left;
      width: 30%;
      background-color: #f5f5f5;
      padding: 30px;
      min-height: 800px;
    }
    
    .main-column {
      float: right;
      width: 70%;
      padding: 30px;
    }
    
    .profile-photo {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
      margin: 0 auto 20px;
      display: block;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 12pt;
      font-weight: 600;
      color: #043e44;
      margin-bottom: 15px;
      position: relative;
      padding-left: 15px;
    }
    
    .section-title:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #03d27c;
      border-radius: 4px;
    }
    
    .summary {
      text-align: justify;
      margin-bottom: 20px;
    }
    
    .skills-list {
      list-style-type: none;
      padding-left: 0;
    }
    
    .skills-list li {
      position: relative;
      padding-left: 15px;
      margin-bottom: 5px;
    }
    
    .skills-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #03d27c;
    }
    
    .experience-item, .education-item, .certificate-item, .extracurricular-item {
      margin-bottom: 20px;
      position: relative;
      padding-left: 20px;
    }
    
    .experience-item:before, .education-item:before, .certificate-item:before, .extracurricular-item:before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: #03d27c;
    }
    
    .experience-item:after, .education-item:after, .certificate-item:after, .extracurricular-item:after {
      content: "";
      position: absolute;
      left: -4px;
      top: 8px;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background-color: #03d27c;
    }
    
    .item-header {
      margin-bottom: 8px;
    }
    
    .company-name, .school-name, .institution-name, .organization-name {
      font-weight: 600;
      color: #043e44;
    }
    
    .job-title, .major, .certificate-name, .role {
      font-weight: 500;
      color: #03d27c;
    }
    
    .date-range {
      font-style: italic;
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }
    
    .responsibilities, .achievements, .description {
      text-align: justify;
    }
    
    .language-list {
      margin-bottom: 20px;
    }
    
    .language-item {
      margin-bottom: 8px;
    }
    
    .language-name {
      font-weight: 500;
      display: block;
    }
    
    .language-proficiency {
      display: block;
      height: 6px;
      background-color: #e0e0e0;
      border-radius: 3px;
      margin-top: 5px;
    }
    
    .proficiency-level {
      height: 100%;
      background-color: #03d27c;
      border-radius: 3px;
    }
    
    .native .proficiency-level { width: 100%; }
    .fluent .proficiency-level { width: 90%; }
    .advanced .proficiency-level { width: 75%; }
    .intermediate .proficiency-level { width: 50%; }
    .basic .proficiency-level { width: 30%; }
    
    .additional-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .skill-pill {
      background-color: #f5f5f5;
      border: 1px solid #03d27c;
      border-radius: 20px;
      padding: 5px 12px;
      font-size: 9pt;
    }
    
    .clearfix:after {
      content: "";
      display: table;
      clear: both;
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <header class="header">
      <h1 class="name">{{personal.firstName}} {{personal.lastName}}</h1>
      <div class="professional-title">{{personal.professionalTitle}}</div>
      <div class="contact-info">
        <div class="contact-item">
          <span>{{personal.email}}</span>
        </div>
        <div class="contact-item">
          <span>{{personal.phone}}</span>
        </div>
        {{#if personal.linkedin}}
        <div class="contact-item">
          <span>linkedin.com/in/{{personal.linkedin}}</span>
        </div>
        {{/if}}
      </div>
    </header>
    
    <div class="clearfix">
      <div class="profile-column">
        {{#if personal.photoUrl}}
        {{#if templateSettings.includePhoto}}
        <img src="{{personal.photoUrl}}" alt="Profile Photo" class="profile-photo">
        {{/if}}
        {{/if}}
        
        {{#each templateSettings.sectionOrder as |section|}}
        {{#if section.visible}}
        
        {{#if (eq section.id "summary")}}
        <section class="section">
          <h2 class="section-title">Professional Summary</h2>
          <div class="summary">
            {{../professional.summary}}
          </div>
        </section>
        {{/if}}
        
        {{#if (eq section.id "keyCompetencies")}}
        <section class="section">
          <h2 class="section-title">Key Competencies</h2>
          {{#if ../keyCompetencies.technicalSkills.length}}
          <div class="mb-3">
            <h3 class="skills-title">Technical Skills</h3>
            <ul class="skills-list">
              {{#each ../keyCompetencies.technicalSkills}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}
          
          {{#if ../keyCompetencies.softSkills.length}}
          <div>
            <h3 class="skills-title">Soft Skills</h3>
            <ul class="skills-list">
              {{#each ../keyCompetencies.softSkills}}
              <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>
          {{/if}}
        </section>
        {{/if}}
        
        {{#if (eq section.id "additional")}}
        <section class="section">
          <h2 class="section-title">Additional Skills</h2>
          {{#if ../languages.length}}
          <div class="language-list">
            <h3 class="skills-title">Languages</h3>
            {{#each ../languages}}
            <div class="language-item">
              <span class="language-name">{{name}}</span>
              <div class="language-proficiency {{proficiency}}">
                <div class="proficiency-level"></div>
              </div>
            </div>
            {{/each}}
          </div>
          {{/if}}
          
          {{#if ../additional.skills.length}}
          <div>
            <h3 class="skills-title">Other Skills</h3>
            <div class="additional-skills">
              {{#each ../additional.skills}}
              <span class="skill-pill">{{this}}</span>
              {{/each}}
            </div>
          </div>
          {{/if}}
        </section>
        {{/if}}
        
        {{/if}}
        {{/each}}
      </div>
      
      <div class="main-column">
        {{#each templateSettings.sectionOrder as |section|}}
        {{#if section.visible}}
        
        {{#if (eq section.id "experience")}}
        <section class="section">
          <h2 class="section-title">Work Experience</h2>
          {{#each ../experience}}
          <div class="experience-item">
            <div class="item-header">
              <div class="company-name">{{companyName}}</div>
              <div class="job-title">{{jobTitle}}</div>
              <div class="date-range">
                {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
              </div>
            </div>
            <div class="responsibilities">
              {{responsibilities}}
            </div>
          </div>
          {{/each}}
        </section>
        {{/if}}
        
        {{#if (eq section.id "education")}}
        <section class="section">
          <h2 class="section-title">Education</h2>
          {{#each ../education}}
          <div class="education-item">
            <div class="item-header">
              <div class="school-name">{{schoolName}}</div>
              <div class="major">{{major}}</div>
              <div class="date-range">
                {{formatDate startDate}} - {{formatDate endDate}}
              </div>
            </div>
            {{#if achievements}}
            <div class="achievements">
              {{achievements}}
            </div>
            {{/if}}
          </div>
          {{/each}}
        </section>
        {{/if}}
        
        {{#if (eq section.id "certificates")}}
        <section class="section">
          <h2 class="section-title">Certifications</h2>
          {{#each ../certificates}}
          <div class="certificate-item">
            <div class="item-header">
              <div class="institution-name">{{institution}}</div>
              <div class="certificate-name">{{name}}</div>
              <div class="date-range">
                {{formatDate dateAcquired}}{{#if expirationDate}} - {{formatDate expirationDate}}{{/if}}
              </div>
            </div>
            {{#if achievements}}
            <div class="achievements">
              {{achievements}}
            </div>
            {{/if}}
          </div>
          {{/each}}
        </section>
        {{/if}}
        
        {{#if (eq section.id "extracurricular")}}
        <section class="section">
          <h2 class="section-title">Extracurricular Activities</h2>
          {{#each ../extracurricular}}
          <div class="extracurricular-item">
            <div class="item-header">
              <div class="organization-name">{{organization}}</div>
              <div class="role">{{role}}</div>
              <div class="date-range">
                {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
              </div>
            </div>
            <div class="description">
              {{description}}
            </div>
          </div>
          {{/each}}
        </section>
        {{/if}}
        
        {{/if}}
        {{/each}}
      </div>
    </div>
  </div>
</body>
</html>`;

const minimalTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{personal.firstName}} {{personal.lastName}} - CV</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
    
    body {
      font-size: 11pt;
      line-height: 1.5;
      color: #333;
      background-color: white;
    }
    
    .cv-container {
      max-width: 21cm;
      margin: 0 auto;
      padding: 30mm 20mm;
      background-color: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .profile-photo {
      width: 120px;
      height: 120px;
      border-radius: 60px;
      object-fit: cover;
      margin: 0 auto 15px;
      display: block;
      border: 1px solid #f0f0f0;
    }
    
    .name {
      font-size: 22pt;
      font-weight: 700;
      letter-spacing: 1px;
      color: #043e44;
      margin-bottom: 5px;
    }
    
    .professional-title {
      font-size: 14pt;
      font-weight: 300;
      color: #03d27c;
      margin-bottom: 15px;
      letter-spacing: 0.5px;
    }
    
    .divider {
      width: 50px;
      height: 2px;
      background-color: #03d27c;
      margin: 10px auto 20px;
    }
    
    .contact-info {
      display: flex;
      justify-content: center;
      gap: 20px;
      font-size: 9pt;
      color: #666;
    }
    
    .section {
      margin-bottom: 25px;
      text-align: center;
    }
    
    .section-title {
      font-size: 14pt;
      font-weight: 600;
      color: #043e44;
      margin-bottom: 15px;
      position: relative;
      display: inline-block;
    }
    
    .section-title:after {
      content: "";
      position: absolute;
      left: -10px;
      right: -10px;
      bottom: -5px;
      height: 1px;
      background-color: #03d27c;
    }
    
    .summary {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 20px;
      font-weight: 300;
    }
    
    .key-competencies {
      display: flex;
      justify-content: center;
      gap: 50px;
      margin-bottom: 20px;
    }
    
    .skills-column {
      text-align: center;
    }
    
    .skills-title {
      font-weight: 500;
      margin-bottom: 10px;
      color: #03d27c;
    }
    
    .skills-list {
      list-style-type: none;
      padding-left: 0;
      font-weight: 300;
    }
    
    .skills-list li {
      margin-bottom: 5px;
    }
    
    .experience-items, .education-items, .certificate-items, .extracurricular-items {
      max-width: 700px;
      margin: 0 auto;
    }
    
    .experience-item, .education-item, .certificate-item, .extracurricular-item {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .experience-item:last-child, .education-item:last-child, .certificate-item:last-child, .extracurricular-item:last-child {
      border-bottom: none;
    }
    
    .item-header {
      margin-bottom: 10px;
    }
    
    .company-name, .school-name, .institution-name, .organization-name {
      font-weight: 600;
      color: #043e44;
    }
    
    .job-title, .major, .certificate-name, .role {
      font-weight: 400;
      color: #03d27c;
      font-size: 10pt;
    }
    
    .date-range {
      font-style: italic;
      font-size: 9pt;
      color: #666;
      margin-top: 2px;
    }
    
    .responsibilities, .achievements, .description {
      text-align: center;
      font-weight: 300;
    }
    
    .language-list {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 15px;
    }
    
    .language-item {
      text-align: center;
      min-width: 100px;
    }
    
    .language-name {
      font-weight: 500;
      margin-bottom: 5px;
    }
    
    .language-proficiency {
      color: #03d27c;
      font-size: 9pt;
      font-style: italic;
    }
    
    .additional-skills {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 15px;
    }
    
    .skill-pill {
      background-color: #f9f9f9;
      border-radius: 20px;
      padding: 5px 15px;
      font-size: 9pt;
      font-weight: 300;
      color: #043e44;
      border: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <header class="header">
      {{#if personal.photoUrl}}
      {{#if templateSettings.includePhoto}}
      <img src="{{personal.photoUrl}}" alt="Profile Photo" class="profile-photo">
      {{/if}}
      {{/if}}
      <h1 class="name">{{personal.firstName}} {{personal.lastName}}</h1>
      <div class="professional-title">{{personal.professionalTitle}}</div>
      <div class="divider"></div>
      <div class="contact-info">
        <div>{{personal.email}}</div>
        <div>{{personal.phone}}</div>
        {{#if personal.linkedin}}
        <div>linkedin.com/in/{{personal.linkedin}}</div>
        {{/if}}
      </div>
    </header>
    
    {{#each templateSettings.sectionOrder as |section|}}
    {{#if section.visible}}
    
    {{#if (eq section.id "summary")}}
    <section class="section">
      <h2 class="section-title">Professional Summary</h2>
      <div class="summary">
        {{../professional.summary}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "keyCompetencies")}}
    <section class="section">
      <h2 class="section-title">Key Competencies</h2>
      <div class="key-competencies">
        {{#if ../keyCompetencies.technicalSkills.length}}
        <div class="skills-column">
          <h3 class="skills-title">Technical Skills</h3>
          <ul class="skills-list">
            {{#each ../keyCompetencies.technicalSkills}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
        
        {{#if ../keyCompetencies.softSkills.length}}
        <div class="skills-column">
          <h3 class="skills-title">Soft Skills</h3>
          <ul class="skills-list">
            {{#each ../keyCompetencies.softSkills}}
            <li>{{this}}</li>
            {{/each}}
          </ul>
        </div>
        {{/if}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "experience")}}
    <section class="section">
      <h2 class="section-title">Work Experience</h2>
      <div class="experience-items">
        {{#each ../experience}}
        <div class="experience-item">
          <div class="item-header">
            <div class="company-name">{{companyName}}</div>
            <div class="job-title">{{jobTitle}}</div>
            <div class="date-range">
              {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
          </div>
          <div class="responsibilities">
            {{responsibilities}}
          </div>
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "education")}}
    <section class="section">
      <h2 class="section-title">Education</h2>
      <div class="education-items">
        {{#each ../education}}
        <div class="education-item">
          <div class="item-header">
            <div class="school-name">{{schoolName}}</div>
            <div class="major">{{major}}</div>
            <div class="date-range">
              {{formatDate startDate}} - {{formatDate endDate}}
            </div>
          </div>
          {{#if achievements}}
          <div class="achievements">
            {{achievements}}
          </div>
          {{/if}}
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "certificates")}}
    <section class="section">
      <h2 class="section-title">Certifications</h2>
      <div class="certificate-items">
        {{#each ../certificates}}
        <div class="certificate-item">
          <div class="item-header">
            <div class="institution-name">{{institution}}</div>
            <div class="certificate-name">{{name}}</div>
            <div class="date-range">
              {{formatDate dateAcquired}}{{#if expirationDate}} - {{formatDate expirationDate}}{{/if}}
            </div>
          </div>
          {{#if achievements}}
          <div class="achievements">
            {{achievements}}
          </div>
          {{/if}}
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "extracurricular")}}
    <section class="section">
      <h2 class="section-title">Extracurricular Activities</h2>
      <div class="extracurricular-items">
        {{#each ../extracurricular}}
        <div class="extracurricular-item">
          <div class="item-header">
            <div class="organization-name">{{organization}}</div>
            <div class="role">{{role}}</div>
            <div class="date-range">
              {{formatDate startDate}} - {{#if isCurrent}}Present{{else}}{{formatDate endDate}}{{/if}}
            </div>
          </div>
          <div class="description">
            {{description}}
          </div>
        </div>
        {{/each}}
      </div>
    </section>
    {{/if}}
    
    {{#if (eq section.id "additional")}}
    <section class="section">
      <h2 class="section-title">Additional Skills</h2>
      {{#if ../languages.length}}
      <div>
        <h3 class="skills-title">Languages</h3>
        <div class="language-list">
          {{#each ../languages}}
          <div class="language-item">
            <div class="language-name">{{name}}</div>
            <div class="language-proficiency">{{proficiency}}</div>
          </div>
          {{/each}}
        </div>
      </div>
      {{/if}}
      
      {{#if ../additional.skills.length}}
      <div class="mt-6">
        <h3 class="skills-title">Other Skills</h3>
        <div class="additional-skills">
          {{#each ../additional.skills}}
          <span class="skill-pill">{{this}}</span>
          {{/each}}
        </div>
      </div>
      {{/if}}
    </section>
    {{/if}}
    
    {{/if}}
    {{/each}}
  </div>
</body>
</html>`;

// Compile templates
const templates = {
  professional: Handlebars.compile(professionalTemplate),
  modern: Handlebars.compile(modernTemplate),
  minimal: Handlebars.compile(minimalTemplate)
};

/**
 * Generate PDF from CV data
 * @param cvData The complete CV data
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDF(cvData: CompleteCV): Promise<Blob> {
  try {
    // Determine which template to use
    const templateType = cvData.templateSettings?.template || 'professional' as TemplateType;
    
    // Create and append HTML content to document
    const template = templates[templateType];
    if (!template) {
      throw new Error(`Template '${templateType}' not found`);
    }
    
    // Generate HTML content
    const htmlContent = template(cvData);
    
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);
    
    // A small delay to ensure fonts are loaded
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create canvas from HTML content
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      allowTaint: true,
      letterRendering: true,
      logging: false
    });
    
    // Create PDF with A4 dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    // Create PDF document
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    let position = 0;
    
    // Add first page
    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;
    
    // Add more pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Generate PDF file name
    const fileName = `${cvData.personal?.firstName || 'cv'}_${
      cvData.personal?.lastName || ''
    }_CV.pdf`.replace(/\s+/g, '_');
    
    // Generate PDF as blob
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate and download PDF from CV data
 * @param cvData The complete CV data
 */
export async function downloadPDF(cvData: CompleteCV): Promise<void> {
  try {
    const pdfBlob = await generatePDF(cvData);
    
    // Generate PDF file name
    const fileName = `${cvData.personal?.firstName || 'cv'}_${
      cvData.personal?.lastName || ''
    }_CV.pdf`.replace(/\s+/g, '_');
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}