import React from 'react';
import { CompleteCV, Experience, Education, Certificate, Extracurricular } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

interface ModernTemplateProps {
  data: CompleteCV;
}

/**
 * Modern template - a clean, contemporary CV design using pure HTML (no CSS)
 */
const ModernTemplateHTML: React.FC<ModernTemplateProps> = ({ data }) => {
  // Get visible sections and sort by order
  const visibleSections = data.templateSettings?.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <table width="100%" cellPadding="0" cellSpacing="0" border="0" bgcolor="#ffffff">
      <tr>
        <td align="center">
          <table width="790" cellPadding="0" cellSpacing="0" border="0">
            {/* Header with background */}
            <tr>
              <td bgcolor="#03d27c" style={{padding: '30px'}}>
                <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                  <tr>
                    <td>
                      <font face="Arial, sans-serif" size="6" color="#ffffff">
                        <b>{data.personal.firstName} {data.personal.lastName}</b>
                      </font>
                    </td>
                    
                    {/* Photo (if enabled) */}
                    {data.templateSettings?.includePhoto && data.personal.photoUrl && (
                      <td align="right" width="120">
                        <table cellPadding="3" cellSpacing="0" border="0" bgcolor="#ffffff">
                          <tr>
                            <td>
                              <img 
                                src={data.personal.photoUrl} 
                                alt={`${data.personal.firstName} ${data.personal.lastName}`}
                                width="100" 
                                height="100" 
                                style={{objectFit: 'cover', borderRadius: '50%'}}
                              />
                            </td>
                          </tr>
                        </table>
                      </td>
                    )}
                  </tr>
                  
                  {data.personal.professionalTitle && (
                    <tr>
                      <td colSpan={data.templateSettings?.includePhoto && data.personal.photoUrl ? 2 : 1}>
                        <font face="Arial, sans-serif" size="4" color="#ffffff">
                          <b>{data.personal.professionalTitle}</b>
                        </font>
                      </td>
                    </tr>
                  )}
                  
                  <tr>
                    <td colSpan={data.templateSettings?.includePhoto && data.personal.photoUrl ? 2 : 1} height="20"></td>
                  </tr>
                  
                  <tr>
                    <td colSpan={data.templateSettings?.includePhoto && data.personal.photoUrl ? 2 : 1}>
                      <table cellPadding="0" cellSpacing="0" border="0">
                        <tr>
                          {data.personal.email && (
                            <td align="left" valign="middle" width="200">
                              <table cellPadding="4" cellSpacing="0" border="0">
                                <tr>
                                  <td valign="middle" width="20">
                                    <font color="#ffffff">✉</font>
                                  </td>
                                  <td valign="middle">
                                    <font face="Arial, sans-serif" size="2" color="#ffffff">
                                      {data.personal.email}
                                    </font>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          )}
                          
                          {data.personal.phone && (
                            <td align="left" valign="middle" width="200">
                              <table cellPadding="4" cellSpacing="0" border="0">
                                <tr>
                                  <td valign="middle" width="20">
                                    <font color="#ffffff">☎</font>
                                  </td>
                                  <td valign="middle">
                                    <font face="Arial, sans-serif" size="2" color="#ffffff">
                                      {data.personal.phone}
                                    </font>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          )}
                          
                          {data.personal.linkedin && (
                            <td align="left" valign="middle">
                              <table cellPadding="4" cellSpacing="0" border="0">
                                <tr>
                                  <td valign="middle" width="20">
                                    <font color="#ffffff">in</font>
                                  </td>
                                  <td valign="middle">
                                    <font face="Arial, sans-serif" size="2" color="#ffffff">
                                      {data.personal.linkedin}
                                    </font>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          )}
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            {/* Content */}
            <tr>
              <td style={{padding: '20px 30px'}}>
                <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                  {/* Render sections according to the order and visibility settings */}
                  {visibleSections.map((section) => {
                    switch (section.id) {
                      case 'summary':
                        return data.professional?.summary ? (
                          <tr key="summary">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Professional Summary</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="10"></td>
                                </tr>
                                <tr>
                                  <td colSpan={3}>
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
                                  <td colSpan={3} height="30"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        ) : null;
                        
                      case 'keyCompetencies':
                        return (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) ? (
                          <tr key="keyCompetencies">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Key Competencies</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="10"></td>
                                </tr>

                                {data.keyCompetencies?.technicalSkills?.length > 0 && (
                                  <>
                                    <tr>
                                      <td colSpan={3}>
                                        <font face="Arial, sans-serif" size="3" color="#333333">
                                          <b>Technical Skills</b>
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} height="5"></td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3}>
                                        <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                          <tr>
                                            <td>
                                              <table cellPadding="5" cellSpacing="5" border="0">
                                                <tr>
                                                  {data.keyCompetencies.technicalSkills.map((skill, index) => (
                                                    <td key={index} bgcolor="#e6fff5" align="center" style={{borderRadius: '20px'}}>
                                                      <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                        {skill}
                                                      </font>
                                                    </td>
                                                  ))}
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} height="20"></td>
                                    </tr>
                                  </>
                                )}

                                {data.keyCompetencies?.softSkills?.length > 0 && (
                                  <>
                                    <tr>
                                      <td colSpan={3}>
                                        <font face="Arial, sans-serif" size="3" color="#333333">
                                          <b>Soft Skills</b>
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} height="5"></td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3}>
                                        <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                          <tr>
                                            <td>
                                              <table cellPadding="5" cellSpacing="5" border="0">
                                                <tr>
                                                  {data.keyCompetencies.softSkills.map((skill, index) => (
                                                    <td key={index} bgcolor="#e6fff5" align="center" style={{borderRadius: '20px'}}>
                                                      <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                        {skill}
                                                      </font>
                                                    </td>
                                                  ))}
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </>
                                )}

                                <tr>
                                  <td colSpan={3} height="30"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        ) : null;
                        
                      case 'experience':
                        return data.experience?.length ? (
                          <tr key="experience">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Professional Experience</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="15"></td>
                                </tr>
                                
                                {data.experience.map((exp: Experience, index: number) => (
                                  <tr key={index}>
                                    <td colSpan={3}>
                                      <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                        <tr>
                                          <td width="15" bgcolor="#e6fff5" style={{borderLeft: '2px solid #03d27c'}}>&nbsp;</td>
                                          <td width="15"></td>
                                          <td>
                                            <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                              <tr>
                                                <td>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{exp.jobTitle}</b>
                                                  </font>
                                                </td>
                                                <td align="right">
                                                  <table cellPadding="3" cellSpacing="0" border="0" bgcolor="#e6fff5" style={{borderRadius: '20px'}}>
                                                    <tr>
                                                      <td>
                                                        <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                                                        </font>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colSpan={2}>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{exp.companyName}</b>
                                                  </font>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colSpan={2} height="10"></td>
                                              </tr>
                                              {exp.responsibilities && (
                                                <tr>
                                                  <td colSpan={2}>
                                                    <table width="100%" cellPadding="3" cellSpacing="0" border="0">
                                                      {exp.responsibilities.split('\n').map((point, i) => (
                                                        <tr key={i}>
                                                          <td width="15" valign="top">
                                                            <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                              •
                                                            </font>
                                                          </td>
                                                          <td>
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
                                      </table>
                                    </td>
                                  </tr>
                                ))}

                                <tr>
                                  <td colSpan={3} height="30"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        ) : null;
                        
                      case 'education':
                        return data.education?.length ? (
                          <tr key="education">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Education</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="15"></td>
                                </tr>
                                
                                {data.education.map((edu: Education, index: number) => (
                                  <tr key={index}>
                                    <td colSpan={3}>
                                      <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                        <tr>
                                          <td width="15" bgcolor="#e6fff5" style={{borderLeft: '2px solid #03d27c'}}>&nbsp;</td>
                                          <td width="15"></td>
                                          <td>
                                            <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                              <tr>
                                                <td>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{edu.major}</b>
                                                  </font>
                                                </td>
                                                <td align="right">
                                                  <table cellPadding="3" cellSpacing="0" border="0" bgcolor="#e6fff5" style={{borderRadius: '20px'}}>
                                                    <tr>
                                                      <td>
                                                        <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                                        </font>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colSpan={2}>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{edu.schoolName}</b>
                                                  </font>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colSpan={2} height="10"></td>
                                              </tr>
                                              {edu.achievements && (
                                                <tr>
                                                  <td colSpan={2}>
                                                    <table width="100%" cellPadding="3" cellSpacing="0" border="0">
                                                      {edu.achievements.split('\n').map((point, i) => (
                                                        <tr key={i}>
                                                          <td width="15" valign="top">
                                                            <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                              •
                                                            </font>
                                                          </td>
                                                          <td>
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
                                      </table>
                                    </td>
                                  </tr>
                                ))}

                                <tr>
                                  <td colSpan={3} height="30"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        ) : null;
                        
                      case 'certificates':
                        return data.certificates?.length ? (
                          <tr key="certificates">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Certifications</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="15"></td>
                                </tr>
                                
                                <tr>
                                  <td colSpan={3}>
                                    <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                      <tr valign="top">
                                        {data.certificates.map((cert: Certificate, index: number) => (
                                          <td key={index} width="50%" style={{padding: '10px'}}>
                                            <table width="100%" cellPadding="10" cellSpacing="0" border="0" bgcolor="#e6fff5">
                                              <tr>
                                                <td>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{cert.name}</b>
                                                  </font>
                                                  <br />
                                                  <font face="Arial, sans-serif" size="2" color="#333333">
                                                    {cert.institution}
                                                  </font>
                                                  <br />
                                                  <font face="Arial, sans-serif" size="2" color="#03d27c">
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
                                  <td colSpan={3} height="30"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        ) : null;
                        
                      case 'extracurricular':
                        return data.extracurricular?.length ? (
                          <tr key="extracurricular">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Extracurricular Activities</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="15"></td>
                                </tr>
                                
                                {data.extracurricular.map((extra: Extracurricular, index: number) => (
                                  <tr key={index}>
                                    <td colSpan={3}>
                                      <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                        <tr>
                                          <td width="15" bgcolor="#e6fff5" style={{borderLeft: '2px solid #03d27c'}}>&nbsp;</td>
                                          <td width="15"></td>
                                          <td>
                                            <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                              <tr>
                                                <td>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{extra.role}</b>
                                                  </font>
                                                </td>
                                                <td align="right">
                                                  <table cellPadding="3" cellSpacing="0" border="0" bgcolor="#e6fff5" style={{borderRadius: '20px'}}>
                                                    <tr>
                                                      <td>
                                                        <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                          {formatDate(extra.startDate)} - {extra.isCurrent ? 'Present' : formatDate(extra.endDate)}
                                                        </font>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colSpan={2}>
                                                  <font face="Arial, sans-serif" size="3" color="#333333">
                                                    <b>{extra.organization}</b>
                                                  </font>
                                                </td>
                                              </tr>
                                              <tr>
                                                <td colSpan={2} height="10"></td>
                                              </tr>
                                              {extra.description && (
                                                <tr>
                                                  <td colSpan={2}>
                                                    <table width="100%" cellPadding="3" cellSpacing="0" border="0">
                                                      {extra.description.split('\n').map((point, i) => (
                                                        <tr key={i}>
                                                          <td width="15" valign="top">
                                                            <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                              •
                                                            </font>
                                                          </td>
                                                          <td>
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
                                      </table>
                                    </td>
                                  </tr>
                                ))}

                                <tr>
                                  <td colSpan={3} height="30"></td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        ) : null;
                        
                      case 'additional':
                        return (data.languages?.length || data.additional?.skills?.length) ? (
                          <tr key="additional">
                            <td>
                              <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                <tr>
                                  <td width="10" bgcolor="#03d27c">
                                    <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" width="10" height="24" alt="" />
                                  </td>
                                  <td width="10"></td>
                                  <td>
                                    <font face="Arial, sans-serif" size="4" color="#03d27c">
                                      <b>Additional Information</b>
                                    </font>
                                  </td>
                                </tr>
                                <tr>
                                  <td colSpan={3} height="15"></td>
                                </tr>
                                
                                {data.languages?.length > 0 && (
                                  <>
                                    <tr>
                                      <td colSpan={3}>
                                        <font face="Arial, sans-serif" size="3" color="#333333">
                                          <b>Languages</b>
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} height="10"></td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3}>
                                        <table width="100%" cellPadding="0" cellSpacing="0" border="0">
                                          <tr>
                                            {data.languages.map((lang, index) => (
                                              <td key={index} align="center" width={(100 / data.languages.length) + '%'}>
                                                <table cellPadding="5" cellSpacing="0" border="0" bgcolor="#e6fff5" width="90%">
                                                  <tr>
                                                    <td align="center">
                                                      <font face="Arial, sans-serif" size="3" color="#333333">
                                                        <b>{lang.name}</b>
                                                      </font>
                                                      <br />
                                                      <font face="Arial, sans-serif" size="2" color="#03d27c">
                                                        {lang.proficiency}
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
                                      <td colSpan={3} height="20"></td>
                                    </tr>
                                  </>
                                )}
                                
                                {data.additional?.skills?.length > 0 && (
                                  <>
                                    <tr>
                                      <td colSpan={3}>
                                        <font face="Arial, sans-serif" size="3" color="#333333">
                                          <b>Additional Skills</b>
                                        </font>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3} height="10"></td>
                                    </tr>
                                    <tr>
                                      <td colSpan={3}>
                                        <table cellPadding="5" cellSpacing="5" border="0">
                                          <tr>
                                            {data.additional.skills.map((skill, index) => (
                                              <td key={index} bgcolor="#e6fff5" align="center" style={{borderRadius: '20px'}}>
                                                <font face="Arial, sans-serif" size="2" color="#03d27c">
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
                                  <td colSpan={3} height="30"></td>
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
        </td>
      </tr>
    </table>
  );
};

export default ModernTemplateHTML;