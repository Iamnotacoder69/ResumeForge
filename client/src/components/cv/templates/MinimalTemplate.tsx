import React from 'react';
import { CompleteCV, Experience, Education, Certificate, Extracurricular } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

interface MinimalTemplateProps {
  data: CompleteCV;
}

/**
 * Minimal template - a clean, minimalist design with plenty of whitespace
 */
const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ data }) => {
  // Get visible sections and sort by order
  const visibleSections = data.templateSettings?.sectionOrder
    ?.filter(section => section.visible)
    .sort((a, b) => a.order - b.order) || [];

  return (
    <div className="cv-template bg-white text-gray-800 p-8 max-w-[210mm] mx-auto shadow-lg print:shadow-none">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-light text-gray-900 mb-2 tracking-wide uppercase">
          {data.personal.firstName} {data.personal.lastName}
        </h1>
        
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-gray-500">
          {data.personal.email && (
            <div>{data.personal.email}</div>
          )}
          
          {data.personal.phone && (
            <div>{data.personal.phone}</div>
          )}
          
          {data.personal.linkedin && (
            <div>{data.personal.linkedin}</div>
          )}
        </div>
        
        {/* Photo (if enabled) - centered under name */}
        {data.templateSettings?.includePhoto && data.personal.photoUrl && (
          <div className="mt-4 flex justify-center">
            <img 
              src={data.personal.photoUrl} 
              alt={`${data.personal.firstName} ${data.personal.lastName}`}
              className="w-20 h-20 object-cover object-center rounded-full border border-gray-200"
            />
          </div>
        )}
      </header>
      
      {/* Content */}
      <div className="cv-content max-w-2xl mx-auto">
        {/* Render sections according to the order and visibility settings */}
        {visibleSections.map((section) => {
          switch (section.id) {
            case 'summary':
              return data.professional?.summary ? (
                <section key="summary" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Profile
                  </h2>
                  <p className="text-gray-700 text-center">{data.professional.summary}</p>
                </section>
              ) : null;
              
            case 'keyCompetencies':
              return (data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length) ? (
                <section key="keyCompetencies" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Key Skills
                  </h2>
                  
                  <div className="space-y-4">
                    {data.keyCompetencies?.technicalSkills?.length > 0 && (
                      <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                          {data.keyCompetencies.technicalSkills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="border border-gray-200 text-gray-700 px-3 py-1 text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {data.keyCompetencies?.softSkills?.length > 0 && (
                      <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                          {data.keyCompetencies.softSkills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="border border-gray-200 text-gray-700 px-3 py-1 text-sm"
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
              
            case 'experience':
              return data.experience?.length ? (
                <section key="experience" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Experience
                  </h2>
                  
                  <div className="space-y-6">
                    {data.experience.map((exp: Experience, index: number) => (
                      <div key={index} className="mb-6">
                        <div className="flex flex-col items-center mb-2">
                          <h3 className="font-medium text-gray-900 uppercase tracking-wide text-center">
                            {exp.jobTitle}
                          </h3>
                          <div className="text-gray-500 text-sm mt-1">
                            {exp.companyName} | {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                          </div>
                        </div>
                        
                        {exp.responsibilities && (
                          <div className="text-gray-700 text-sm mt-2">
                            {exp.responsibilities.split('\n').map((point, i) => (
                              <div key={i} className="text-center mb-1">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') 
                                  ? point.trim().substring(1).trim()
                                  : point.trim()}
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
                <section key="education" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Education
                  </h2>
                  
                  <div className="space-y-6">
                    {data.education.map((edu: Education, index: number) => (
                      <div key={index} className="mb-6">
                        <div className="flex flex-col items-center mb-2">
                          <h3 className="font-medium text-gray-900 uppercase tracking-wide text-center">
                            {edu.major}
                          </h3>
                          <div className="text-gray-500 text-sm mt-1">
                            {edu.schoolName} | {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                          </div>
                        </div>
                        
                        {edu.achievements && (
                          <div className="text-gray-700 text-sm mt-2">
                            {edu.achievements.split('\n').map((point, i) => (
                              <div key={i} className="text-center mb-1">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') 
                                  ? point.trim().substring(1).trim()
                                  : point.trim()}
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
                <section key="certificates" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Certifications
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.certificates.map((cert: Certificate, index: number) => (
                      <div key={index} className="text-center border border-gray-100 p-4">
                        <h3 className="font-medium text-gray-900">{cert.name}</h3>
                        <div className="text-gray-500 text-sm mt-1">
                          {cert.institution}
                        </div>
                        <div className="text-gray-400 text-sm mt-1">
                          {formatDate(cert.dateAcquired)}
                          {cert.expirationDate && ` - ${formatDate(cert.expirationDate)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
              
            case 'extracurricular':
              return data.extracurricular?.length ? (
                <section key="extracurricular" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Extracurricular Activities
                  </h2>
                  
                  <div className="space-y-6">
                    {data.extracurricular.map((extra: Extracurricular, index: number) => (
                      <div key={index} className="mb-6">
                        <div className="flex flex-col items-center mb-2">
                          <h3 className="font-medium text-gray-900 uppercase tracking-wide text-center">
                            {extra.role}
                          </h3>
                          <div className="text-gray-500 text-sm mt-1">
                            {extra.organization} | {formatDate(extra.startDate)} - {extra.isCurrent ? 'Present' : formatDate(extra.endDate)}
                          </div>
                        </div>
                        
                        {extra.description && (
                          <div className="text-gray-700 text-sm mt-2">
                            {extra.description.split('\n').map((point, i) => (
                              <div key={i} className="text-center mb-1">
                                {point.trim().startsWith('-') || point.trim().startsWith('•') 
                                  ? point.trim().substring(1).trim()
                                  : point.trim()}
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
                <section key="additional" className="mb-8">
                  <h2 className="text-lg font-normal text-gray-500 uppercase tracking-widest text-center mb-4">
                    Additional Information
                  </h2>
                  
                  {data.languages?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap justify-center gap-4">
                        {data.languages.map((lang, index) => (
                          <div key={index} className="text-center">
                            <span className="font-medium">{lang.name}</span>
                            <span className="text-gray-500 ml-1">({lang.proficiency})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {data.additional?.skills?.length > 0 && (
                    <div>
                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-2">
                        {data.additional.skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="border border-gray-200 text-gray-700 px-3 py-1 text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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

export default MinimalTemplate;