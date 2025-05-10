import React from 'react';
import { CompleteCV, Experience, Education, Certificate, Extracurricular } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

interface ModernTemplateProps {
  data: CompleteCV;
}

/**
 * Modern template - a clean, contemporary CV design with bold typography and visual elements
 */
const ModernTemplate: React.FC<ModernTemplateProps> = ({ data }) => {
  // Get visible sections and sort by order
  const visibleSections = data.templateSettings?.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <div className="cv-template bg-white text-gray-800 p-8 max-w-[210mm] mx-auto shadow-lg print:shadow-none">
      {/* Header with background */}
      <header className="bg-blue-600 -m-8 p-8 mb-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {data.personal.firstName} {data.personal.lastName}
            </h1>
            
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-90 mt-2">
              {data.personal.email && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{data.personal.email}</span>
                </div>
              )}
              
              {data.personal.phone && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{data.personal.phone}</span>
                </div>
              )}
              
              {data.personal.linkedin && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>{data.personal.linkedin}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Photo (if enabled) */}
          {data.templateSettings?.includePhoto && data.personal.photoUrl && (
            <div className="ml-4">
              <img 
                src={data.personal.photoUrl} 
                alt={`${data.personal.firstName} ${data.personal.lastName}`}
                className="w-28 h-28 object-cover object-center rounded-full border-4 border-white shadow-md"
              />
            </div>
          )}
        </div>
      </header>
      
      {/* Content */}
      <div className="cv-content">
        {/* Render sections according to the order and visibility settings */}
        {visibleSections.map((section) => {
          switch (section.id) {
            case 'summary':
              return data.professional?.summary ? (
                <section key="summary" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-3 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Professional Summary
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line">{data.professional.summary}</p>
                </section>
              ) : null;
              
            case 'keyCompetencies':
              return (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) ? (
                <section key="keyCompetencies" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-3 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Key Competencies
                  </h2>
                  
                  {data.keyCompetencies?.technicalSkills?.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Technical Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.keyCompetencies.technicalSkills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.keyCompetencies?.softSkills?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Soft Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {data.keyCompetencies.softSkills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ) : null;
              
            case 'experience':
              return data.experience?.length ? (
                <section key="experience" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Professional Experience
                  </h2>
                  
                  <div className="space-y-6">
                    {data.experience.map((exp: Experience, index: number) => (
                      <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5"></div>
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{exp.jobTitle}</h3>
                          <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                            {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                          </span>
                        </div>
                        
                        <div className="text-gray-700 font-medium mb-2">{exp.companyName}</div>
                        
                        {exp.responsibilities && (
                          <div className="text-gray-700 whitespace-pre-line">
                            {exp.responsibilities.split('\n').map((point, i) => (
                              <div key={i} className="pl-4 relative mb-1.5">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') ? (
                                  <>
                                    <span className="absolute left-0 text-blue-500">•</span>
                                    {point.trim().substring(1).trim()}
                                  </>
                                ) : point}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
              
            case 'education':
              return data.education?.length ? (
                <section key="education" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Education
                  </h2>
                  
                  <div className="space-y-6">
                    {data.education.map((edu: Education, index: number) => (
                      <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5"></div>
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">{edu.major}</h3>
                          <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                            {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                          </span>
                        </div>
                        
                        <div className="text-gray-700 font-medium mb-2">{edu.schoolName}</div>
                        
                        {edu.achievements && (
                          <div className="text-gray-700 whitespace-pre-line">
                            {edu.achievements.split('\n').map((point, i) => (
                              <div key={i} className="pl-4 relative mb-1.5">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') ? (
                                  <>
                                    <span className="absolute left-0 text-blue-500">•</span>
                                    {point.trim().substring(1).trim()}
                                  </>
                                ) : point}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
              
            case 'certificates':
              return data.certificates?.length ? (
                <section key="certificates" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Certifications
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.certificates.map((cert: Certificate, index: number) => (
                      <div key={index} className="bg-blue-50 p-4 rounded-md">
                        <div className="flex flex-col mb-2">
                          <h3 className="font-bold text-gray-900">{cert.name}</h3>
                          <div className="text-sm text-blue-600">
                            {formatDate(cert.dateAcquired)}
                            {cert.expirationDate && ` - ${formatDate(cert.expirationDate)}`}
                          </div>
                        </div>
                        
                        <div className="text-gray-700 text-sm mb-2">{cert.institution}</div>
                        
                        {cert.achievements && (
                          <div className="text-sm text-gray-600 whitespace-pre-line">
                            {cert.achievements.split('\n').map((point, i) => (
                              <div key={i} className="pl-4 relative mb-1">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') ? (
                                  <>
                                    <span className="absolute left-0 text-blue-500">•</span>
                                    {point.trim().substring(1).trim()}
                                  </>
                                ) : point}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
              
            case 'extracurricular':
              return data.extracurricular?.length ? (
                <section key="extracurricular" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Extracurricular Activities
                  </h2>
                  
                  <div className="space-y-6">
                    {data.extracurricular.map((extra: Extracurricular, index: number) => (
                      <div key={index} className="relative pl-6 border-l-2 border-blue-200">
                        <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5"></div>
                        
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 mb-2">
                          <h3 className="font-bold text-gray-900">{extra.role}</h3>
                          <span className="text-sm text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                            {formatDate(extra.startDate)} - {extra.isCurrent ? 'Present' : formatDate(extra.endDate)}
                          </span>
                        </div>
                        
                        <div className="text-gray-700 font-medium mb-2">{extra.organization}</div>
                        
                        {extra.description && (
                          <div className="text-gray-700 whitespace-pre-line">
                            {extra.description.split('\n').map((point, i) => (
                              <div key={i} className="pl-4 relative mb-1.5">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') ? (
                                  <>
                                    <span className="absolute left-0 text-blue-500">•</span>
                                    {point.trim().substring(1).trim()}
                                  </>
                                ) : point}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
              
            case 'additional':
              return (data.languages?.length || data.additional?.skills?.length) ? (
                <section key="additional" className="mb-8 cv-section">
                  <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-2"></span>
                    Additional Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.languages?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">Languages</h3>
                        <div className="space-y-2">
                          {data.languages.map((lang, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="font-medium">{lang.name}</span>
                              <span className="text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                {lang.proficiency}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {data.additional?.skills?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3">Additional Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {data.additional.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ) : null;
              
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};

export default ModernTemplate;