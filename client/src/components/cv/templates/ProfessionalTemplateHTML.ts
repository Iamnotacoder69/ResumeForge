import { CompleteCV } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

/**
 * Generates a purely HTML version of the Professional CV template
 * This function constructs raw HTML without any CSS styles using tables for layout
 */
export default function generateProfessionalHTML(data: CompleteCV): string {
  // Get visible sections and sort by order
  const visibleSections = data.templateSettings?.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];
  
  // Header HTML
  let headerHTML = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
          <font face="Arial, sans-serif" size="6" color="#043e44">
            <b>${data.personal.firstName} ${data.personal.lastName}</b>
          </font>
        </td>
        ${data.templateSettings?.includePhoto && data.personal.photoUrl ? `
          <td align="right" width="120">
            <img 
              src="${data.personal.photoUrl}" 
              alt="${data.personal.firstName} ${data.personal.lastName}"
              width="100" 
              height="100" 
              style="object-fit: cover;"
            />
          </td>
        ` : ''}
      </tr>
      
      ${data.personal.professionalTitle ? `
        <tr>
          <td colspan="${data.templateSettings?.includePhoto && data.personal.photoUrl ? 2 : 1}">
            <font face="Arial, sans-serif" size="4" color="#666666">
              ${data.personal.professionalTitle}
            </font>
          </td>
        </tr>
      ` : ''}
      
      <tr>
        <td colspan="${data.templateSettings?.includePhoto && data.personal.photoUrl ? 2 : 1}" height="20"></td>
      </tr>
      
      <tr>
        <td colspan="${data.templateSettings?.includePhoto && data.personal.photoUrl ? 2 : 1}">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${data.personal.email ? `
                <td align="left" valign="middle" width="200">
                  <table cellpadding="4" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="20">
                        <font color="#666666">✉</font>
                      </td>
                      <td valign="middle">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${data.personal.email}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
              ` : ''}
              
              ${data.personal.phone ? `
                <td align="left" valign="middle" width="200">
                  <table cellpadding="4" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="20">
                        <font color="#666666">☎</font>
                      </td>
                      <td valign="middle">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${data.personal.phone}
                        </font>
                      </td>
                    </tr>
                  </table>
                </td>
              ` : ''}
              
              ${data.personal.linkedin ? `
                <td align="left" valign="middle">
                  <table cellpadding="4" cellspacing="0" border="0">
                    <tr>
                      <td valign="middle" width="20">
                        <font color="#666666">in</font>
                      </td>
                      <td valign="middle">
                        <font face="Arial, sans-serif" size="2" color="#666666">
                          ${data.personal.linkedin}
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
        if (data.professional?.summary) {
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
                    ${data.professional.summary.split('\n').map(paragraph => 
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
        if (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) {
          let techSkillsHTML = '';
          let softSkillsHTML = '';
          
          if (data.keyCompetencies?.technicalSkills?.length > 0) {
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
                      ${data.keyCompetencies.technicalSkills.map(skill => `
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
          
          if (data.keyCompetencies?.softSkills?.length > 0) {
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
                      ${data.keyCompetencies.softSkills.map(skill => `
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
        if (data.experience?.length) {
          let experiencesHTML = '';
          
          data.experience.forEach(exp => {
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
        if (data.education?.length) {
          let educationsHTML = '';
          
          data.education.forEach(edu => {
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
        if (data.certificates?.length) {
          let certificatesHTML = '';
          
          // Create rows with two certificates per row
          for (let i = 0; i < data.certificates.length; i += 2) {
            const cert1 = data.certificates[i];
            const cert2 = i + 1 < data.certificates.length ? data.certificates[i + 1] : null;
            
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
        
      // Additional cases for other sections as needed
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