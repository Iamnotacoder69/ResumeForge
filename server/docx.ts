import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, 
  ExternalHyperlink, PageBreak, Table, TableRow, TableCell, WidthType, 
  BorderStyle, Tab, SectionType, Header, Footer, HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom, ImageRun } from "docx";
import { CompleteCV, SectionOrder } from "@shared/types";
import * as fs from "fs";

// Standardized spacing constants 
const SPACING = {
  SECTION: 12,            // Space between sections (in points)
  ENTRY: 8,               // Space between entries (in points)
  HEADING_AFTER: 6,       // Space after headings (in points)
  PARAGRAPH_SPACING: 8,   // Space between paragraphs (in points)
  SECTION_TITLE_BEFORE: 14 // Space before section titles (in points)
};

/**
 * Generates a DOCX document from CV data with consistent spacing
 * @param data Complete CV data
 * @returns Document object that can be serialized to a buffer
 */
export async function generateDOCX(data: CompleteCV): Promise<Buffer> {
  // Set up document sections based on user preferences or use default
  const defaultSectionOrder: SectionOrder[] = [
    { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
    { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
    { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
    { id: 'experience', name: 'Work Experience', visible: true, order: 3 },
    { id: 'education', name: 'Education', visible: true, order: 4 },
    { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
    { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
    { id: 'additional', name: 'Additional Information', visible: true, order: 7 },
  ];

  // Use user-defined section order or fall back to default
  const visibleSections = data.templateSettings?.sectionOrder?.filter(section => section.visible) || defaultSectionOrder;
  
  // Sort sections by order
  const sectionOrder = [...visibleSections].sort((a, b) => a.order - b.order);

  // Create document sections
  const sections = [];

  // Create personal information section (header)
  const personalInfoSection = createPersonalInfoSection(data);
  sections.push(personalInfoSection);

  // Create main content sections
  for (const section of sectionOrder) {
    // Skip personal section (already handled above)
    if (section.id === 'personal') continue;
    
    const sectionContent = createSection(section.id, section.name, data);
    if (sectionContent.length > 0) {
      sections.push(...sectionContent);
    }
  }

  // Create the document with all sections
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch (720 twips)
              right: 720,  // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720,   // 0.5 inch
            },
          },
        },
        children: sections,
      },
    ],
  });

  // Create a buffer from the document
  return await Buffer.from(await doc.save());
}

/**
 * Creates the personal information section at the top of the CV
 */
function createPersonalInfoSection(data: CompleteCV): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Full name
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 100, // 5pt
      },
      children: [
        new TextRun({
          text: `${data.personal.firstName} ${data.personal.lastName}`,
          bold: true,
          size: 28, // 14pt
        }),
      ],
    })
  );

  // Contact info (centered, single line)
  const contactInfo: TextRun[] = [];
  
  // Email
  contactInfo.push(new TextRun({ text: data.personal.email, size: 20 }));
  
  // Add separator before phone if email exists
  if (data.personal.email) {
    contactInfo.push(new TextRun({ text: " | ", size: 20 }));
  }
  
  // Phone
  contactInfo.push(new TextRun({ text: data.personal.phone, size: 20 }));
  
  // Add LinkedIn if available
  if (data.personal.linkedin) {
    contactInfo.push(new TextRun({ text: " | ", size: 20 }));
    contactInfo.push(
      new TextRun({ 
        text: `LinkedIn: ${data.personal.linkedin}`, 
        size: 20
      })
    );
  }
  
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 200, // 10pt
      },
      children: contactInfo,
    })
  );
  
  return paragraphs;
}

/**
 * Creates a section of the CV with appropriate heading and content
 */
function createSection(sectionId: string, sectionName: string, data: CompleteCV): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  
  // Only add the section if it has content
  switch(sectionId) {
    case 'summary':
      if (data.summary?.summary) {
        // Section title
        paragraphs.push(createSectionHeading(sectionName));
        
        // Summary content
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
            children: [
              new TextRun({
                text: data.summary.summary,
                size: 22, // 11pt
              }),
            ],
          })
        );
      }
      break;
      
    case 'keyCompetencies':
      if (data.keyCompetencies?.technicalSkills?.length > 0 || 
          data.keyCompetencies?.softSkills?.length > 0) {
        
        // Section title
        paragraphs.push(createSectionHeading(sectionName));
        
        // Technical skills
        if (data.keyCompetencies.technicalSkills?.length > 0) {
          paragraphs.push(
            new Paragraph({
              spacing: {
                before: SPACING.ENTRY * 20,
                after: SPACING.PARAGRAPH_SPACING * 20,
              },
              children: [
                new TextRun({
                  text: "Technical Skills",
                  bold: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Add skills as bullet points
          for (const skill of data.keyCompetencies.technicalSkills) {
            paragraphs.push(
              new Paragraph({
                bullet: {
                  level: 0,
                },
                children: [
                  new TextRun({
                    text: skill,
                    size: 22, // 11pt
                  }),
                ],
              })
            );
          }
        }
        
        // Soft skills
        if (data.keyCompetencies.softSkills?.length > 0) {
          paragraphs.push(
            new Paragraph({
              spacing: {
                before: SPACING.ENTRY * 20,
                after: SPACING.PARAGRAPH_SPACING * 20,
              },
              children: [
                new TextRun({
                  text: "Soft Skills",
                  bold: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Add skills as bullet points
          for (const skill of data.keyCompetencies.softSkills) {
            paragraphs.push(
              new Paragraph({
                bullet: {
                  level: 0,
                },
                children: [
                  new TextRun({
                    text: skill,
                    size: 22, // 11pt
                  }),
                ],
              })
            );
          }
        }
        
        // Add extra spacing after the entire section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
          })
        );
      }
      break;
      
    case 'experience':
      if (data.experience?.length > 0) {
        // Section title
        paragraphs.push(createSectionHeading(sectionName));
        
        // Process each experience entry
        data.experience.forEach((exp, index) => {
          // Job title and company
          paragraphs.push(
            new Paragraph({
              spacing: {
                before: SPACING.ENTRY * 20,
                after: 0,
              },
              children: [
                new TextRun({
                  text: exp.jobTitle,
                  bold: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Company name and dates
          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          let endDateDisplay = '';
          if (exp.isCurrent) {
            endDateDisplay = 'Present';
          } else if (exp.endDate) {
            endDateDisplay = new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
          
          paragraphs.push(
            new Paragraph({
              spacing: {
                after: SPACING.PARAGRAPH_SPACING * 20,
              },
              children: [
                new TextRun({
                  text: `${exp.companyName} - ${startDate} to ${endDateDisplay}`,
                  italics: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Responsibilities - create bullet points from paragraphs
          if (exp.responsibilities) {
            // Split the responsibilities by newlines to create bullet points
            const responsibilities = exp.responsibilities.split('\n').filter(r => r.trim().length > 0);
            
            for (const responsibility of responsibilities) {
              paragraphs.push(
                new Paragraph({
                  bullet: {
                    level: 0,
                  },
                  children: [
                    new TextRun({
                      text: responsibility.trim(),
                      size: 22, // 11pt
                    }),
                  ],
                })
              );
            }
          }
          
          // Only add extra space if this is not the last item
          if (index < data.experience.length - 1) {
            paragraphs.push(
              new Paragraph({
                spacing: {
                  after: SPACING.ENTRY * 20,
                },
              })
            );
          }
        });
        
        // Add extra spacing after the entire section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
          })
        );
      }
      break;
      
    case 'education':
      if (data.education?.length > 0) {
        // Section title
        paragraphs.push(createSectionHeading(sectionName));
        
        // Process each education entry
        data.education.forEach((edu, index) => {
          // School name
          paragraphs.push(
            new Paragraph({
              spacing: {
                before: SPACING.ENTRY * 20,
                after: 0,
              },
              children: [
                new TextRun({
                  text: edu.schoolName,
                  bold: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Major and dates
          const startDate = edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          const endDate = edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          
          paragraphs.push(
            new Paragraph({
              spacing: {
                after: SPACING.PARAGRAPH_SPACING * 20,
              },
              children: [
                new TextRun({
                  text: `${edu.major} - ${startDate} to ${endDate}`,
                  italics: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Achievements if any
          if (edu.achievements) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: edu.achievements,
                    size: 22, // 11pt
                  }),
                ],
              })
            );
          }
          
          // Only add extra space if this is not the last item
          if (index < data.education.length - 1) {
            paragraphs.push(
              new Paragraph({
                spacing: {
                  after: SPACING.ENTRY * 20,
                },
              })
            );
          }
        });
        
        // Add extra spacing after the entire section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
          })
        );
      }
      break;
      
    case 'certificates':
      if (data.certificates?.length > 0) {
        // Section title
        paragraphs.push(createSectionHeading(sectionName));
        
        // Process each certificate entry
        data.certificates.forEach((cert, index) => {
          // Certificate name
          paragraphs.push(
            new Paragraph({
              spacing: {
                before: SPACING.ENTRY * 20,
                after: 0,
              },
              children: [
                new TextRun({
                  text: cert.name,
                  bold: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Institution and date
          const dateAcquired = cert.dateAcquired ? new Date(cert.dateAcquired).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          const expirationDate = cert.expirationDate ? ` (Expires: ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : '';
          
          paragraphs.push(
            new Paragraph({
              spacing: {
                after: SPACING.PARAGRAPH_SPACING * 20,
              },
              children: [
                new TextRun({
                  text: `${cert.institution} - ${dateAcquired}${expirationDate}`,
                  italics: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Only add extra space if this is not the last item
          if (index < data.certificates.length - 1) {
            paragraphs.push(
              new Paragraph({
                spacing: {
                  after: SPACING.ENTRY * 20,
                },
              })
            );
          }
        });
        
        // Add extra spacing after the entire section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
          })
        );
      }
      break;
      
    case 'extracurricular':
      if (data.extracurricular?.length > 0) {
        // Section title
        paragraphs.push(createSectionHeading(sectionName));
        
        // Process each extracurricular entry
        data.extracurricular.forEach((activity, index) => {
          // Role and organization
          paragraphs.push(
            new Paragraph({
              spacing: {
                before: SPACING.ENTRY * 20,
                after: 0,
              },
              children: [
                new TextRun({
                  text: activity.role,
                  bold: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Organization and dates
          const startDate = activity.startDate ? new Date(activity.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          let endDateDisplay = '';
          if (activity.isCurrent) {
            endDateDisplay = 'Present';
          } else if (activity.endDate) {
            endDateDisplay = new Date(activity.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
          
          paragraphs.push(
            new Paragraph({
              spacing: {
                after: SPACING.PARAGRAPH_SPACING * 20,
              },
              children: [
                new TextRun({
                  text: `${activity.organization} - ${startDate} to ${endDateDisplay}`,
                  italics: true,
                  size: 22, // 11pt
                }),
              ],
            })
          );
          
          // Description - create bullet points from paragraphs if possible
          if (activity.description) {
            const descriptions = activity.description.split('\n').filter(d => d.trim().length > 0);
            
            for (const desc of descriptions) {
              paragraphs.push(
                new Paragraph({
                  bullet: {
                    level: 0,
                  },
                  children: [
                    new TextRun({
                      text: desc.trim(),
                      size: 22, // 11pt
                    }),
                  ],
                })
              );
            }
          }
          
          // Only add extra space if this is not the last item
          if (index < data.extracurricular.length - 1) {
            paragraphs.push(
              new Paragraph({
                spacing: {
                  after: SPACING.ENTRY * 20,
                },
              })
            );
          }
        });
        
        // Add extra spacing after the entire section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
          })
        );
      }
      break;
      
    case 'additional':
      // Languages section
      if (data.languages?.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: {
              before: SPACING.ENTRY * 20,
              after: SPACING.PARAGRAPH_SPACING * 20,
            },
            children: [
              new TextRun({
                text: "Languages",
                bold: true,
                size: 22, // 11pt
              }),
            ],
          })
        );
        
        // Process languages
        data.languages.forEach((lang, index) => {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${lang.name}: ${lang.proficiency}`,
                  size: 22, // 11pt
                }),
              ],
            })
          );
        });
        
        // Add spacing after languages section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.ENTRY * 20,
            },
          })
        );
      }
      
      // Additional skills
      if (data.additional?.skills?.length > 0) {
        paragraphs.push(
          new Paragraph({
            spacing: {
              before: SPACING.ENTRY * 20,
              after: SPACING.PARAGRAPH_SPACING * 20,
            },
            children: [
              new TextRun({
                text: "Additional Skills",
                bold: true,
                size: 22, // 11pt
              }),
            ],
          })
        );
        
        // Add skills as bullet points
        for (const skill of data.additional.skills) {
          paragraphs.push(
            new Paragraph({
              bullet: {
                level: 0,
              },
              children: [
                new TextRun({
                  text: skill,
                  size: 22, // 11pt
                }),
              ],
            })
          );
        }
        
        // Add extra spacing after the entire section
        paragraphs.push(
          new Paragraph({
            spacing: {
              after: SPACING.SECTION * 20,
            },
          })
        );
      }
      break;
  }
  
  return paragraphs;
}

/**
 * Creates a consistently formatted section heading
 */
function createSectionHeading(title: string): Paragraph {
  return new Paragraph({
    spacing: {
      before: SPACING.SECTION_TITLE_BEFORE * 20,
      after: SPACING.HEADING_AFTER * 20,
    },
    heading: HeadingLevel.HEADING_2,
    thematicBreak: true, // Adds a horizontal line under the heading
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 22, // 11pt
      }),
    ],
  });
}