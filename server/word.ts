import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { CompleteCV } from '../shared/types';

/**
 * Generates a Word document from CV data
 * @param data Complete CV data
 * @returns Buffer containing the Word document
 */
export async function generateWord(data: CompleteCV): Promise<Buffer> {
  const { personal, professional, keyCompetencies, experience, education, certificates, extracurricular, languages, additional, templateSettings } = data;
  
  const sections = templateSettings?.sectionOrder || [
    { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
    { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
    { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
    { id: 'experience', name: 'Professional Experience', visible: true, order: 3 },
    { id: 'education', name: 'Education', visible: true, order: 4 },
    { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
    { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
    { id: 'additional', name: 'Additional Information', visible: true, order: 7 },
  ];

  // Sort sections by order
  const orderedSections = [...sections].filter(s => s.visible).sort((a, b) => a.order - b.order);
  
  // Create document with sections
  const doc = new Document({
    sections: [{
      properties: {},
      children: []
    }],
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: {
            size: 22, // 11pt
            font: "Calibri",
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing
            },
          },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          run: {
            size: 28, // 14pt
            bold: true,
            font: "Calibri",
          },
          paragraph: {
            spacing: {
              after: 120, // Space after paragraph
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          run: {
            size: 24, // 12pt
            bold: true,
            font: "Calibri",
            color: "4472C4", // Blue color for section headings
          },
          paragraph: {
            spacing: {
              before: 240, // Space before heading
              after: 120, // Space after heading
            },
          },
        },
      ],
    },
  });

  const children: Paragraph[] = [];

  // Add personal info section
  if (personal) {
    // Name heading
    children.push(
      new Paragraph({
        text: `${personal.firstName} ${personal.lastName}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );

    // Contact info
    const contactInfo = new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: personal.email, size: 22 }),
        new TextRun({ text: " | ", size: 22 }),
        new TextRun({ text: personal.phone, size: 22 }),
      ],
    });

    if (personal.linkedin) {
      contactInfo.addChildElement(new TextRun({ text: " | ", size: 22 }));
      contactInfo.addChildElement(new TextRun({ text: personal.linkedin, size: 22 }));
    }

    children.push(contactInfo);
  }

  // Add sections based on order
  for (const section of orderedSections) {
    switch (section.id) {
      case 'summary':
        if (professional?.summary) {
          children.push(
            new Paragraph({
              text: "Professional Summary",
              heading: HeadingLevel.HEADING_2,
            })
          );
          
          children.push(
            new Paragraph({
              text: professional.summary,
              spacing: {
                after: 280, // Space after paragraph
              },
            })
          );
        }
        break;

      case 'keyCompetencies':
        if (keyCompetencies && (keyCompetencies.technicalSkills.length > 0 || keyCompetencies.softSkills.length > 0)) {
          children.push(
            new Paragraph({
              text: "Key Competencies",
              heading: HeadingLevel.HEADING_2,
            })
          );

          if (keyCompetencies.technicalSkills.length > 0) {
            children.push(
              new Paragraph({
                text: "Technical Skills:",
                style: "Normal",
                bullet: {
                  level: 0,
                },
                spacing: {
                  after: 80,
                },
              })
            );

            for (const skill of keyCompetencies.technicalSkills) {
              children.push(
                new Paragraph({
                  text: skill,
                  style: "Normal",
                  bullet: {
                    level: 1,
                  },
                })
              );
            }
          }

          if (keyCompetencies.softSkills.length > 0) {
            children.push(
              new Paragraph({
                text: "Soft Skills:",
                style: "Normal",
                bullet: {
                  level: 0,
                },
                spacing: {
                  before: 120,
                  after: 80,
                },
              })
            );

            for (const skill of keyCompetencies.softSkills) {
              children.push(
                new Paragraph({
                  text: skill,
                  style: "Normal",
                  bullet: {
                    level: 1,
                  },
                })
              );
            }
          }

          // Add space after the entire section
          children.push(
            new Paragraph({
              text: "",
              spacing: {
                before: 140,
              },
            })
          );
        }
        break;

      case 'experience':
        if (experience && experience.length > 0) {
          children.push(
            new Paragraph({
              text: "Professional Experience",
              heading: HeadingLevel.HEADING_2,
            })
          );

          for (const exp of experience) {
            const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endDateDisplay = exp.isCurrent ? 'Present' : 
                                  exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

            // Use TextRun with bold formatting
            const titleRun = new TextRun({
              text: exp.jobTitle,
              bold: true,
              size: 22,
            });
            
            children.push(
              new Paragraph({
                children: [titleRun],
                spacing: {
                  before: 200,
                },
              })
            );

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${exp.companyName} | ${startDate} - ${endDateDisplay}`,
                    italics: true,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              })
            );

            children.push(
              new Paragraph({
                text: exp.responsibilities,
                spacing: {
                  after: 120,
                },
              })
            );
          }
        }
        break;

      case 'education':
        if (education && education.length > 0) {
          children.push(
            new Paragraph({
              text: "Education",
              heading: HeadingLevel.HEADING_2,
            })
          );

          for (const edu of education) {
            const startDate = new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endDate = new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

            // Use TextRun with bold formatting
            const majorRun = new TextRun({
              text: edu.major,
              bold: true,
              size: 22,
            });
            
            children.push(
              new Paragraph({
                children: [majorRun],
                spacing: {
                  before: 200,
                },
              })
            );

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${edu.schoolName} | ${startDate} - ${endDate}`,
                    italics: true,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              })
            );

            if (edu.achievements) {
              children.push(
                new Paragraph({
                  text: edu.achievements,
                  spacing: {
                    after: 120,
                  },
                })
              );
            }
          }
        }
        break;

      case 'certificates':
        if (certificates && certificates.length > 0) {
          children.push(
            new Paragraph({
              text: "Certificates",
              heading: HeadingLevel.HEADING_2,
            })
          );

          for (const cert of certificates) {
            const dateAcquired = new Date(cert.dateAcquired).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const expirationText = cert.expirationDate ? 
                             ` (Expires: ${new Date(cert.expirationDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})` : '';

            // Use TextRun with bold formatting
            const certNameRun = new TextRun({
              text: cert.name,
              bold: true,
              size: 22,
            });
            
            children.push(
              new Paragraph({
                children: [certNameRun],
                spacing: {
                  before: 200,
                },
              })
            );

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${cert.institution} | ${dateAcquired}${expirationText}`,
                    italics: true,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              })
            );

            if (cert.achievements) {
              children.push(
                new Paragraph({
                  text: cert.achievements,
                  spacing: {
                    after: 120,
                  },
                })
              );
            }
          }
        }
        break;

      case 'extracurricular':
        if (extracurricular && extracurricular.length > 0) {
          children.push(
            new Paragraph({
              text: "Extracurricular Activities",
              heading: HeadingLevel.HEADING_2,
            })
          );

          for (const activity of extracurricular) {
            const startDate = new Date(activity.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endDateDisplay = activity.isCurrent ? 'Present' : 
                                activity.endDate ? new Date(activity.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';

            // Use TextRun with bold formatting
            const roleRun = new TextRun({
              text: activity.role,
              bold: true,
              size: 22,
            });
            
            children.push(
              new Paragraph({
                children: [roleRun],
                spacing: {
                  before: 200,
                },
              })
            );

            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${activity.organization} | ${startDate} - ${endDateDisplay}`,
                    italics: true,
                  }),
                ],
                spacing: {
                  after: 120,
                },
              })
            );

            children.push(
              new Paragraph({
                text: activity.description,
                spacing: {
                  after: 120,
                },
              })
            );
          }
        }
        break;

      case 'additional':
        const hasSkills = additional && additional.skills && additional.skills.length > 0;
        const hasLanguages = languages && languages.length > 0;
        
        if (hasSkills || hasLanguages) {
          children.push(
            new Paragraph({
              text: "Additional Information",
              heading: HeadingLevel.HEADING_2,
            })
          );

          if (hasSkills) {
            // Use TextRun with bold formatting
            const skillsTitleRun = new TextRun({
              text: "Computer Skills",
              bold: true,
              size: 22,
            });
            
            children.push(
              new Paragraph({
                children: [skillsTitleRun],
                spacing: {
                  before: 160,
                  after: 80,
                },
              })
            );

            children.push(
              new Paragraph({
                text: additional.skills.join(", "),
                spacing: {
                  after: 160,
                },
              })
            );
          }

          if (hasLanguages) {
            // Use TextRun with bold formatting
            const langTitleRun = new TextRun({
              text: "Languages",
              bold: true,
              size: 22,
            });
            
            children.push(
              new Paragraph({
                children: [langTitleRun],
                spacing: {
                  before: 160,
                  after: 80,
                },
              })
            );

            const languagesText = languages.map(lang => 
              `${lang.name} (${lang.proficiency.charAt(0).toUpperCase() + lang.proficiency.slice(1)})`
            ).join(", ");

            children.push(
              new Paragraph({
                text: languagesText,
                spacing: {
                  after: 160,
                },
              })
            );
          }
        }
        break;
    }
  }

  // Instead of trying to directly modify doc.sections[0].children,
  // we'll use the proper document API
  const updatedDoc = new Document({
    sections: [{
      properties: {},
      children: children
    }],
    styles: doc.styles
  });

  // Create a buffer with the word document
  const buffer = await Packer.toBuffer(updatedDoc);
  return buffer;
}