import React from 'react';
import { CompleteCV, Experience, Education, Certificate, Extracurricular } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

interface MinimalTemplateProps {
  data: CompleteCV;
}

/**
 * Minimal template - a clean, minimalist design using pure HTML (no CSS)
 */
const MinimalTemplateHTML: React.FC<MinimalTemplateProps> = ({ data }) => {
  // Get visible sections and sort by order
  const visibleSections = data.templateSettings?.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <table width="100%" cellPadding="0" cellSpacing="0" border="0" bgcolor="#ffffff">
      <tr>
        <td align="center">
          <table width="790" cellPadding="20" cellSpacing="0" border="0">
            {/* Header */}
            <tr>
              <td align="center">
                <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                  <tr>
                    <td align="center">
                      <font face="Arial, sans-serif" size="6" color="#333333">
                        <span style={{textTransform: 'uppercase', letterSpacing: '4px', fontWeight: 'normal'}}>
                          {data.personal.firstName} {data.personal.lastName}
                        </span>
                      </font>
                    </td>
                  </tr>
                  
                  {data.personal.professionalTitle && (
                    <tr>
                      <td align="center">
                        <font face="Arial, sans-serif" size="4" color="#666666" style={{letterSpacing: '2px', fontWeight: 'normal'}}>
                          {data.personal.professionalTitle}
                        </font>
                      </td>
                    </tr>
                  )}
                  
                  <tr>
                    <td height="20"></td>
                  </tr>
                  
                  <tr>
                    <td align="center">
                      <table cellPadding="0" cellSpacing="0" border="0">
                        <tr>
                          {data.personal.email && (
                            <td align="center" style={{padding: '0 15px'}}>
                              <font face="Arial, sans-serif" size="2" color="#666666">
                                {data.personal.email}
                              </font>
                            </td>
                          )}
                          
                          {data.personal.phone && (
                            <td align="center" style={{padding: '0 15px'}}>
                              <font face="Arial, sans-serif" size="2" color="#666666">
                                {data.personal.phone}
                              </font>
                            </td>
                          )}
                          
                          {data.personal.linkedin && (
                            <td align="center" style={{padding: '0 15px'}}>
                              <font face="Arial, sans-serif" size="2" color="#666666">
                                {data.personal.linkedin}
                              </font>
                            </td>
                          )}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  {/* Photo (if enabled) */}
                  {data.templateSettings?.includePhoto && data.personal.photoUrl && (
                    <>
                      <tr>
                        <td height="20"></td>
                      </tr>
                      <tr>
                        <td align="center">
                          <table cellPadding="1" cellSpacing="0" border="0" bgcolor="#e0e0e0" style={{borderRadius: '50%'}}>
                            <tr>
                              <td>
                                <img 
                                  src={data.personal.photoUrl} 
                                  alt={`${data.personal.firstName} ${data.personal.lastName}`}
                                  width="80" 
                                  height="80" 
                                  style={{borderRadius: '50%', objectFit: 'cover'}}
                                />
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </>
                  )}
                </table>
              </td>
            </tr>
            
            <tr>
              <td height="20"></td>
            </tr>
            
            {/* Content */}
            {visibleSections.map((section) => {
              switch (section.id) {
                case 'summary':
                  return data.professional?.summary ? (
                    <tr key="summary">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Profile
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="2" color="#333333">
                                {data.professional.summary.split('\n').map((paragraph, idx) => (
                                  <React.Fragment key={idx}>
                                    {paragraph}
                                    <br/><br/>
                                  </React.Fragment>
                                ))}
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="30"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                case 'keyCompetencies':
                  return (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) ? (
                    <tr key="keyCompetencies">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Key Skills
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>

                          {data.keyCompetencies?.technicalSkills?.length > 0 && (
                            <tr>
                              <td align="center">
                                <table cellPadding="5" cellSpacing="5" border="0">
                                  <tr>
                                    {data.keyCompetencies.technicalSkills.map((skill, index) => (
                                      <td key={index} style={{border: '1px solid #e0e0e0'}}>
                                        <font face="Arial, sans-serif" size="2" color="#333333">
                                          {skill}
                                        </font>
                                      </td>
                                    ))}
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          )}

                          {data.keyCompetencies?.softSkills?.length > 0 && (
                            <>
                              <tr>
                                <td height="10"></td>
                              </tr>
                              <tr>
                                <td align="center">
                                  <table cellPadding="5" cellSpacing="5" border="0">
                                    <tr>
                                      {data.keyCompetencies.softSkills.map((skill, index) => (
                                        <td key={index} style={{border: '1px solid #e0e0e0'}}>
                                          <font face="Arial, sans-serif" size="2" color="#333333">
                                            {skill}
                                          </font>
                                        </td>
                                      ))}
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </>
                          )}
                          
                          <tr>
                            <td height="30"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                case 'experience':
                  return data.experience?.length ? (
                    <tr key="experience">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Experience
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>
                          
                          {data.experience.map((exp: Experience, index: number) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td align="center">
                                  <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '600px'}}>
                                    <tr>
                                      <td align="center">
                                        <font face="Arial, sans-serif" size="3" color="#333333" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>
                                          {exp.jobTitle}
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td align="center">
                                        <font face="Arial, sans-serif" size="2" color="#666666">
                                          {exp.companyName} | {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td height="10"></td>
                                    </tr>
                                    
                                    {exp.responsibilities && (
                                      <tr>
                                        <td align="center">
                                          <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                            {exp.responsibilities.split('\n').map((point, i) => (
                                              <tr key={i}>
                                                <td align="center">
                                                  <font face="Arial, sans-serif" size="2" color="#333333">
                                                    {point.trim().startsWith('-') || point.trim().startsWith('•') 
                                                      ? point.trim().substring(1).trim()
                                                      : point}
                                                  </font>
                                                </td>
                                              </tr>
                                            ))}
                                          </table>
                                        </td>
                                      </tr>
                                    )}
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td height="25"></td>
                              </tr>
                            </React.Fragment>
                          ))}
                          
                          <tr>
                            <td height="20"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                case 'education':
                  return data.education?.length ? (
                    <tr key="education">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Education
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>
                          
                          {data.education.map((edu: Education, index: number) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td align="center">
                                  <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '600px'}}>
                                    <tr>
                                      <td align="center">
                                        <font face="Arial, sans-serif" size="3" color="#333333" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>
                                          {edu.major}
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td align="center">
                                        <font face="Arial, sans-serif" size="2" color="#666666">
                                          {edu.schoolName} | {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td height="10"></td>
                                    </tr>
                                    
                                    {edu.achievements && (
                                      <tr>
                                        <td align="center">
                                          <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                            {edu.achievements.split('\n').map((point, i) => (
                                              <tr key={i}>
                                                <td align="center">
                                                  <font face="Arial, sans-serif" size="2" color="#333333">
                                                    {point.trim().startsWith('-') || point.trim().startsWith('•') 
                                                      ? point.trim().substring(1).trim()
                                                      : point}
                                                  </font>
                                                </td>
                                              </tr>
                                            ))}
                                          </table>
                                        </td>
                                      </tr>
                                    )}
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td height="25"></td>
                              </tr>
                            </React.Fragment>
                          ))}
                          
                          <tr>
                            <td height="20"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                case 'certificates':
                  return data.certificates?.length ? (
                    <tr key="certificates">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Certifications
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>
                          
                          <tr>
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr valign="top">
                                  {data.certificates.map((cert: Certificate, index: number) => (
                                    <td key={index} width="50%" align="center" style={{padding: '10px'}}>
                                      <table width="100%" cellPadding="10" cellSpacing="0" border="1" bordercolor="#e0e0e0">
                                        <tr>
                                          <td align="center">
                                            <font face="Arial, sans-serif" size="3" color="#333333">
                                              {cert.name}
                                            </font>
                                            <br />
                                            <font face="Arial, sans-serif" size="2" color="#666666">
                                              {cert.institution}
                                            </font>
                                            <br />
                                            <font face="Arial, sans-serif" size="2" color="#999999">
                                              {formatDate(cert.dateAcquired)}
                                              {cert.expirationDate && ` - ${formatDate(cert.expirationDate)}`}
                                            </font>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  ))}
                                </tr>
                              </table>
                            </td>
                          </tr>
                          
                          <tr>
                            <td height="30"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                case 'extracurricular':
                  return data.extracurricular?.length ? (
                    <tr key="extracurricular">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Extracurricular Activities
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>
                          
                          {data.extracurricular.map((extra: Extracurricular, index: number) => (
                            <React.Fragment key={index}>
                              <tr>
                                <td align="center">
                                  <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '600px'}}>
                                    <tr>
                                      <td align="center">
                                        <font face="Arial, sans-serif" size="3" color="#333333" style={{textTransform: 'uppercase', letterSpacing: '1px'}}>
                                          {extra.role}
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td align="center">
                                        <font face="Arial, sans-serif" size="2" color="#666666">
                                          {extra.organization} | {formatDate(extra.startDate)} - {extra.isCurrent ? 'Present' : formatDate(extra.endDate)}
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td height="10"></td>
                                    </tr>
                                    
                                    {extra.description && (
                                      <tr>
                                        <td align="center">
                                          <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                            {extra.description.split('\n').map((point, i) => (
                                              <tr key={i}>
                                                <td align="center">
                                                  <font face="Arial, sans-serif" size="2" color="#333333">
                                                    {point.trim().startsWith('-') || point.trim().startsWith('•') 
                                                      ? point.trim().substring(1).trim()
                                                      : point}
                                                  </font>
                                                </td>
                                              </tr>
                                            ))}
                                          </table>
                                        </td>
                                      </tr>
                                    )}
                                  </table>
                                </td>
                              </tr>
                              <tr>
                                <td height="25"></td>
                              </tr>
                            </React.Fragment>
                          ))}
                          
                          <tr>
                            <td height="20"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                case 'additional':
                  return (data.languages?.length || data.additional?.skills?.length) ? (
                    <tr key="additional">
                      <td align="center">
                        <table width="100%" cellPadding="0" cellSpacing="0" border="0" style={{maxWidth: '700px'}}>
                          <tr>
                            <td align="center">
                              <font face="Arial, sans-serif" size="3" color="#666666" style={{letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 'normal'}}>
                                Additional Information
                              </font>
                            </td>
                          </tr>
                          <tr>
                            <td height="15"></td>
                          </tr>
                          
                          {data.languages?.length > 0 && (
                            <tr>
                              <td align="center">
                                <table cellPadding="8" cellSpacing="8" border="0">
                                  <tr>
                                    {data.languages.map((lang, index) => (
                                      <td key={index} align="center">
                                        <font face="Arial, sans-serif" size="3" color="#333333">
                                          {lang.name}
                                        </font>
                                        <font face="Arial, sans-serif" size="2" color="#666666">
                                          &nbsp;({lang.proficiency})
                                        </font>
                                      </td>
                                    ))}
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          )}
                          
                          {data.additional?.skills?.length > 0 && (
                            <>
                              <tr>
                                <td height="15"></td>
                              </tr>
                              <tr>
                                <td align="center">
                                  <table cellPadding="5" cellSpacing="5" border="0">
                                    <tr>
                                      {data.additional.skills.map((skill, index) => (
                                        <td key={index} style={{border: '1px solid #e0e0e0'}}>
                                          <font face="Arial, sans-serif" size="2" color="#333333">
                                            {skill}
                                          </font>
                                        </td>
                                      ))}
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </>
                          )}
                          
                          <tr>
                            <td height="30"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  ) : null;
                  
                default:
                  return null;
              }
            })}
          </table>
        </td>
      </tr>
    </table>
  );
};

export default MinimalTemplateHTML;