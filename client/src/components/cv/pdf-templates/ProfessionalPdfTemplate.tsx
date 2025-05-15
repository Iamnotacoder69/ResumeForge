import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CompleteCV } from '@shared/types';
import { formatDate } from '@/lib/date-utils';

// Register custom fonts if needed
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ.ttf',
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#03d27c',
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 80,
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#043e44',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#03d27c',
    marginBottom: 8,
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 4,
    color: '#333',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#043e44',
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#03d27c',
    paddingBottom: 4,
  },
  summary: {
    marginBottom: 12,
    lineHeight: 1.5,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skill: {
    marginRight: 8,
    marginBottom: 6,
    padding: '3 6',
    backgroundColor: '#f0f9f6',
    borderRadius: 4,
    fontSize: 10,
  },
  experienceItem: {
    marginBottom: 12,
  },
  organizationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#043e44',
  },
  organization: {
    fontWeight: 'bold',
    color: '#03d27c',
  },
  dateRange: {
    fontSize: 10,
    color: '#666',
  },
  description: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  languageItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  languageName: {
    fontWeight: 'bold',
    width: 100,
  },
  twoColumns: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  column: {
    flex: 1,
    paddingRight: 10,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  }
});

// Helper function to create bullet points from text
const createBulletPoints = (text: string) => {
  if (!text) return [];
  return text.split('\n').filter(line => line.trim().length > 0);
};

interface ProfessionalPdfTemplateProps {
  data: CompleteCV;
}

const ProfessionalPdfTemplate: React.FC<ProfessionalPdfTemplateProps> = ({ data }) => {
  const visibleSections = data.templateSettings?.sectionOrder?.filter(s => s.visible) || [];
  const orderedSections = [...visibleSections].sort((a, b) => a.order - b.order);

  // Create a renderer function to generate sections based on order
  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'summary':
        return (
          <View>
            <Text style={styles.sectionHeading}>Professional Summary</Text>
            <Text style={styles.summary}>{data.professional?.summary}</Text>
          </View>
        );
      case 'keyCompetencies':
        return (
          <View>
            <Text style={styles.sectionHeading}>Key Competencies</Text>
            {data.keyCompetencies?.technicalSkills?.length > 0 && (
              <>
                <Text style={styles.itemTitle}>Technical Skills</Text>
                <View style={styles.skillsContainer}>
                  {data.keyCompetencies.technicalSkills.map((skill, index) => (
                    <Text key={index} style={styles.skill}>{skill}</Text>
                  ))}
                </View>
              </>
            )}
            {data.keyCompetencies?.softSkills?.length > 0 && (
              <>
                <Text style={styles.itemTitle}>Soft Skills</Text>
                <View style={styles.skillsContainer}>
                  {data.keyCompetencies.softSkills.map((skill, index) => (
                    <Text key={index} style={styles.skill}>{skill}</Text>
                  ))}
                </View>
              </>
            )}
          </View>
        );
      case 'experience':
        return (
          <View>
            <Text style={styles.sectionHeading}>Work Experience</Text>
            {data.experience?.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.organizationRow}>
                  <Text style={styles.itemTitle}>{exp.jobTitle}</Text>
                  <Text style={styles.dateRange}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                  </Text>
                </View>
                <Text style={styles.organization}>{exp.companyName}</Text>
                {createBulletPoints(exp.responsibilities).map((point, i) => (
                  <Text key={i} style={styles.description}>• {point}</Text>
                ))}
              </View>
            ))}
          </View>
        );
      case 'education':
        return (
          <View>
            <Text style={styles.sectionHeading}>Education</Text>
            {data.education?.map((edu, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.organizationRow}>
                  <Text style={styles.itemTitle}>{edu.major}</Text>
                  <Text style={styles.dateRange}>
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </Text>
                </View>
                <Text style={styles.organization}>{edu.schoolName}</Text>
                {edu.achievements && (
                  <Text style={styles.description}>{edu.achievements}</Text>
                )}
              </View>
            ))}
          </View>
        );
      case 'certificates':
        return (
          <View>
            <Text style={styles.sectionHeading}>Certificates</Text>
            {data.certificates?.map((cert, index) => (
              <View key={index} style={styles.experienceItem}>
                <Text style={styles.itemTitle}>{cert.name}</Text>
                <Text style={styles.organization}>{cert.institution}</Text>
                <Text style={styles.dateRange}>
                  Acquired: {formatDate(cert.dateAcquired)}
                  {cert.expirationDate && ` | Expires: ${formatDate(cert.expirationDate)}`}
                </Text>
                {cert.achievements && (
                  <Text style={styles.description}>{cert.achievements}</Text>
                )}
              </View>
            ))}
          </View>
        );
      case 'extracurricular':
        return (
          <View>
            <Text style={styles.sectionHeading}>Extracurricular Activities</Text>
            {data.extracurricular?.map((extra, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.organizationRow}>
                  <Text style={styles.itemTitle}>{extra.role}</Text>
                  <Text style={styles.dateRange}>
                    {formatDate(extra.startDate)} - {extra.isCurrent ? 'Present' : formatDate(extra.endDate)}
                  </Text>
                </View>
                <Text style={styles.organization}>{extra.organization}</Text>
                <Text style={styles.description}>{extra.description}</Text>
              </View>
            ))}
          </View>
        );
      case 'additional':
        return (
          <View>
            <Text style={styles.sectionHeading}>Additional Skills</Text>
            <View style={styles.skillsContainer}>
              {data.additional?.skills?.map((skill, index) => (
                <Text key={index} style={styles.skill}>{skill}</Text>
              ))}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with personal information */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{data.personal?.firstName} {data.personal?.lastName}</Text>
            <Text style={styles.title}>{data.personal?.professionalTitle}</Text>
            <Text style={styles.contactInfo}>{data.personal?.email}</Text>
            <Text style={styles.contactInfo}>{data.personal?.phone}</Text>
            {data.personal?.linkedin && (
              <Text style={styles.contactInfo}>{data.personal?.linkedin}</Text>
            )}
          </View>
          {data.templateSettings?.includePhoto && data.personal?.photoUrl && (
            <View style={styles.headerRight}>
              <Image 
                src={data.personal.photoUrl} 
                style={styles.photo} 
                cache={true}
              />
            </View>
          )}
        </View>
        
        {/* Main content - rendered based on section order */}
        {orderedSections.map((section) => (
          <React.Fragment key={section.id}>
            {renderSection(section.id)}
          </React.Fragment>
        ))}
        
        {/* Languages section (always at the bottom) */}
        {data.languages && data.languages.length > 0 && (
          <View>
            <Text style={styles.sectionHeading}>Languages</Text>
            {data.languages.map((lang, index) => (
              <View key={index} style={styles.languageItem}>
                <Text style={styles.languageName}>{lang.name}</Text>
                <Text style={styles.description}>{lang.proficiency}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ProfessionalPdfTemplate;