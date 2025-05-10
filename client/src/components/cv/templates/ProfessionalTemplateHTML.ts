import { CompleteCV } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

/**
 * Generates a purely HTML version of the Professional CV template
 * This function constructs raw HTML without any CSS styles using tables for layout
 */
export default function generateProfessionalHTML(data: CompleteCV): string {
  // Create safe defaults for all data sections  
  const personal = data?.personal || {
    firstName: '',
    lastName: '',
    professionalTitle: '',
    email: '',
    phone: '',
    linkedin: '',
    photoUrl: ''
  };
  
  const templateSettings = data?.templateSettings || {
    includePhoto: false,
    template: 'professional',
    sectionOrder: []
  };
  
  const professional = data?.professional || { 
    summary: '' 
  };
  
  const keyCompetencies = data?.keyCompetencies || { 
    technicalSkills: [], 
    softSkills: [] 
  };
  
  const experience = data?.experience || [];
  
  const education = data?.education || [];
  
  const certificates = data?.certificates || [];
  
  const extracurricular = data?.extracurricular || [];
  
  const additional = data?.additional || { 
    skills: [] 
  };
  
  // Get visible sections and sort by order
  const visibleSections = templateSettings.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];
  
  // Header HTML
  let headerHTML = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <font face="Arial, sans-serif" size="6" color="#043e44">
            <b>${personal.firstName} ${personal.lastName}</b>
          </font>
        </td>
        ${templateSettings.includePhoto && personal.photoUrl ? `
          <td align="right" width="120">
            <img 
              src="${personal.photoUrl}" 
              alt="${personal.firstName} ${personal.lastName}"
              width="100" 
              height="100" 
              style="object-fit: cover;"
            />
          </td>
        ` : ''}
      </tr>
      
      ${personal.professionalTitle ? `
        <tr>
          <td colspan="${templateSettings.includePhoto && personal.photoUrl ? 2 : 1}">
            <font face="Arial, sans-serif" size="4" color="#666666">
              ${personal.professionalTitle}
            </font>
          </td>
        </tr>
      ` : ''}
      
      <tr>
        <td colspan="${templateSettings.includePhoto && personal.photoUrl ? 2 : 1}" height="20"></td>
      </tr>
      
      <tr>
        <td colspan="${templateSettings.includePhoto && personal.photoUrl ? 2 : 1}">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${personal.email ? `
                <td align="left" valign="middle" width="200">
                  <table cellpadding="4" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="20">
                        <font color="#666666">✉</font>
                      </td>
                      <td valign="middle">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${personal.email}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
              ` : ''}
              
              ${personal.phone ? `
                <td align="left" valign="middle" width="200">
                  <table cellpadding="4" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="20">
                        <font color="#666666">☎</font>
                      </td>
                      <td valign="middle">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${personal.phone}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
              ` : ''}
              
              ${personal.linkedin ? `
                <td align="left" valign="middle">
                  <table cellpadding="4" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="20">
                        <font color="#666666">in</font>
                      </td>
                      <td valign="middle">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${personal.linkedin}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
              ` : ''}
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
  
  // Content HTML - build section by section
  let contentHTML = '';
  
  visibleSections.forEach(section => {
    switch (section.id) {
      case 'summary':
        if (professional.summary) {
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Professional Summary</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="2" color="#333333">
                    ${professional.summary.split('\n').map(paragraph => 
                      `${paragraph}<br/><br/>`
                    ).join('')}
                  </font>
                </td>
              </tr>
            </table>
          `;
        }
        break;
        
      case 'keyCompetencies':
        if (keyCompetencies.technicalSkills.length || keyCompetencies.softSkills.length) {
          let techSkillsHTML = '';
          let softSkillsHTML = '';
          
          if (keyCompetencies.technicalSkills.length > 0) {
            techSkillsHTML = `
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="3" color="#043e44">
                    <b>Technical Skills</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5"></td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="5" cellspacing="5" border="0">
                    <tr>
                      ${keyCompetencies.technicalSkills.map(skill => `
                        <td bgcolor="#f2f2f2" align="center">
                          <font face="Arial, sans-serif" size="2" color="#333333">
                            ${skill}
                          </font>
                        </td>
                      `).join('')}
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td height="15"></td>
              </tr>
            `;
          }
          
          if (keyCompetencies.softSkills.length > 0) {
            softSkillsHTML = `
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="3" color="#043e44">
                    <b>Soft Skills</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5"></td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="5" cellspacing="5" border="0">
                    <tr>
                      ${keyCompetencies.softSkills.map(skill => `
                        <td bgcolor="#f2f2f2" align="center">
                          <font face="Arial, sans-serif" size="2" color="#333333">
                            ${skill}
                          </font>
                        </td>
                      `).join('')}
                    </tr>
                  </table>
                </td>
              </tr>
            `;
          }
          
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Key Competencies</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              ${techSkillsHTML}
              ${softSkillsHTML}
            </table>
          `;
        }
        break;
        
      case 'experience':
        if (experience.length) {
          let experiencesHTML = '';
          
          experience.forEach(exp => {
            let responsibilitiesHTML = '';
            
            if (exp.responsibilities) {
              responsibilitiesHTML = `
                <tr>
                  <td colspan="2">
                    <table width="100%" cellpadding="2" cellspacing="0" border="0">
                      ${exp.responsibilities.split('\n').map(point => `
                        <tr>
                          <td width="15" valign="top">
                            <font face="Arial, sans-serif" size="2" color="#333333">
                              •
                            </font>
                          </td>
                          <td>
                            <font face="Arial, sans-serif" size="2" color="#333333">
                              ${point.trim().startsWith('-') || point.trim().startsWith('•') 
                                ? point.trim().substring(1).trim()
                                : point}
                            </font>
                          </td>
                        </tr>
                      `).join('')}
                    </table>
                  </td>
                </tr>
              `;
            }
            
            experiencesHTML += `
              <tr>
                <td style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <font face="Arial, sans-serif" size="3" color="#043e44">
                          <b>${exp.jobTitle}</b>
                        </font>
                      </td>
                      <td align="right">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${formatDate(exp.startDate)} - ${exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <font face="Arial, sans-serif" size="3" color="#333333">
                          ${exp.companyName}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" height="10"></td>
                    </tr>
                    ${responsibilitiesHTML}
                  </table>
                </td>
              </tr>
            `;
          });
          
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Professional Experience</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              ${experiencesHTML}
            </table>
          `;
        }
        break;
        
      case 'education':
        if (education.length) {
          let educationsHTML = '';
          
          education.forEach(edu => {
            let achievementsHTML = '';
            
            if (edu.achievements) {
              achievementsHTML = `
                <tr>
                  <td colspan="2">
                    <table width="100%" cellpadding="2" cellspacing="0" border="0">
                      ${edu.achievements.split('\n').map(point => `
                        <tr>
                          <td width="15" valign="top">
                            <font face="Arial, sans-serif" size="2" color="#333333">
                              •
                            </font>
                          </td>
                          <td>
                            <font face="Arial, sans-serif" size="2" color="#333333">
                              ${point.trim().startsWith('-') || point.trim().startsWith('•') 
                                ? point.trim().substring(1).trim()
                                : point}
                            </font>
                          </td>
                        </tr>
                      `).join('')}
                    </table>
                  </td>
                </tr>
              `;
            }
            
            educationsHTML += `
              <tr>
                <td style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <font face="Arial, sans-serif" size="3" color="#043e44">
                          <b>${edu.major}</b>
                        </font>
                      </td>
                      <td align="right">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <font face="Arial, sans-serif" size="3" color="#333333">
                          ${edu.schoolName}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" height="10"></td>
                    </tr>
                    ${achievementsHTML}
                  </table>
                </td>
              </tr>
            `;
          });
          
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Education</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              ${educationsHTML}
            </table>
          `;
        }
        break;
        
      case 'certificates':
        if (certificates.length) {
          let certificatesHTML = '';
          
          // Create rows with two certificates per row
          for (let i = 0; i < certificates.length; i += 2) {
            const cert1 = certificates[i];
            const cert2 = i + 1 < certificates.length ? certificates[i + 1] : null;
            
            certificatesHTML += `
              <tr>
                <td width="50%" valign="top" style="padding: 0 10px 20px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <font face="Arial, sans-serif" size="3" color="#043e44">
                          <b>${cert1.name}</b>
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <font face="Arial, sans-serif" size="2" color="#333333">
                          ${cert1.institution}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${formatDate(cert1.dateAcquired)}
                          ${cert1.expirationDate ? ` - ${formatDate(cert1.expirationDate)}` : ''}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
                ${cert2 ? `
                  <td width="50%" valign="top" style="padding: 0 0 20px 10px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <font face="Arial, sans-serif" size="3" color="#043e44">
                            <b>${cert2.name}</b>
                          </font>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <font face="Arial, sans-serif" size="2" color="#333333">
                            ${cert2.institution}
                          </font>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <font face="Arial, sans-serif" size="2" color="#666666">
                            ${formatDate(cert2.dateAcquired)}
                            ${cert2.expirationDate ? ` - ${formatDate(cert2.expirationDate)}` : ''}
                          </font>
                        </td>
                      </tr>
                    </table>
                  </td>
                ` : '<td width="50%"></td>'}
              </tr>
            `;
          }
          
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Certifications</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${certificatesHTML}
                  </table>
                </td>
              </tr>
            </table>
          `;
        }
        break;
        
      case 'extracurricular':
        if (extracurricular.length) {
          let extracurricularHTML = '';
          
          extracurricular.forEach(extra => {
            extracurricularHTML += `
              <tr>
                <td style="padding-bottom: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <font face="Arial, sans-serif" size="3" color="#043e44">
                          <b>${extra.role}</b>
                        </font>
                      </td>
                      <td align="right">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${formatDate(extra.startDate)} - ${extra.isCurrent ? 'Present' : formatDate(extra.endDate || '')}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <font face="Arial, sans-serif" size="3" color="#333333">
                          ${extra.organization}
                        </font>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" height="10"></td>
                    </tr>
                    <tr>
                      <td colspan="2">
                        <font face="Arial, sans-serif" size="2" color="#333333">
                          ${extra.description}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            `;
          });
          
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Extracurricular Activities</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              ${extracurricularHTML}
            </table>
          `;
        }
        break;
        
      case 'additional':
        if (additional.skills && additional.skills.length > 0) {
          contentHTML += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
              <tr>
                <td>
                  <font face="Arial, sans-serif" size="4" color="#043e44">
                    <b>Additional Skills</b>
                  </font>
                </td>
              </tr>
              <tr>
                <td height="5" bgcolor="#03d27c">
                  <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="1" height="1" alt="" />
                </td>
              </tr>
              <tr>
                <td height="10"></td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="5" cellspacing="5" border="0">
                    <tr>
                      ${additional.skills.map(skill => `
                        <td bgcolor="#f2f2f2" align="center">
                          <font face="Arial, sans-serif" size="2" color="#333333">
                            ${skill}
                          </font>
                        </td>
                      `).join('')}
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `;
        }
        break;
    }
  });
  
  // Complete HTML document
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
      <tr>
        <td align="center">
          <table width="790" cellpadding="20" cellspacing="0" border="0">
            <tr>
              <td>
                ${headerHTML}
                ${contentHTML}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}