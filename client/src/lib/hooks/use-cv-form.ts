import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeCvSchema } from "@shared/schema";
import { CompleteCV, SectionOrder } from "@shared/types";
import { useEffect } from "react";

export function useCVForm() {
  // Default section order
  const defaultSectionOrder: SectionOrder[] = [
    { id: 'summary' as const, name: 'Professional Summary', visible: true, order: 0 },
    { id: 'keyCompetencies' as const, name: 'Key Competencies', visible: true, order: 1 },
    { id: 'experience' as const, name: 'Work Experience', visible: true, order: 2 },
    { id: 'education' as const, name: 'Education', visible: true, order: 3 },
    { id: 'certificates' as const, name: 'Certificates', visible: true, order: 4 },
    { id: 'extracurricular' as const, name: 'Extracurricular Activities', visible: true, order: 5 },
    { id: 'additional' as const, name: 'Additional Information', visible: true, order: 6 },
  ];

  // Initialize with default values
  const defaultValues: CompleteCV = {
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedin: "",
      photoUrl: "",
    },
    professional: {
      summary: "",
    },
    keyCompetencies: {
      technicalSkills: [],
      softSkills: [],
    },
    experience: [
      {
        companyName: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        responsibilities: "",
      },
    ],
    education: [
      {
        schoolName: "",
        major: "",
        startDate: "",
        endDate: "",
        achievements: "",
      },
    ],
    certificates: [],
    extracurricular: [
      {
        organization: "",
        role: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      },
    ],
    additional: {
      skills: [],
    },
    languages: [
      {
        name: "",
        proficiency: "intermediate",
      },
    ],
    templateSettings: {
      template: "professional",
      includePhoto: false,
      sectionOrder: defaultSectionOrder,
    },
  };

  // Check for imported CV data from sessionStorage
  let initialValues = defaultValues;
  try {
    const importedDataString = sessionStorage.getItem('importedCVData');
    if (importedDataString) {
      const importedData = JSON.parse(importedDataString);
      if (importedData?.success && importedData?.data) {
        // Merge imported data with defaults to ensure all fields exist
        initialValues = {
          ...defaultValues,
          ...importedData.data,
          // Ensure nested objects are properly merged
          personal: {
            ...defaultValues.personal,
            ...importedData.data.personal,
          },
          professional: {
            ...defaultValues.professional,
            ...importedData.data.professional,
          },
          keyCompetencies: {
            ...defaultValues.keyCompetencies,
            ...importedData.data.keyCompetencies,
          },
          additional: {
            ...defaultValues.additional,
            ...importedData.data.additional,
          },
          templateSettings: {
            ...defaultValues.templateSettings,
            ...importedData.data.templateSettings,
          },
        };
        
        // Handle arrays (preserve imported data if it exists)
        if (importedData.data.experience && importedData.data.experience.length > 0) {
          initialValues.experience = importedData.data.experience;
        }
        if (importedData.data.education && importedData.data.education.length > 0) {
          initialValues.education = importedData.data.education;
        }
        if (importedData.data.certificates && importedData.data.certificates.length > 0) {
          initialValues.certificates = importedData.data.certificates;
        }
        if (importedData.data.extracurricular && importedData.data.extracurricular.length > 0) {
          initialValues.extracurricular = importedData.data.extracurricular;
        }
        if (importedData.data.languages && importedData.data.languages.length > 0) {
          initialValues.languages = importedData.data.languages;
        }
      }
    }
  } catch (error) {
    console.error('Error loading imported CV data:', error);
    // If there's an error, use default values
    initialValues = defaultValues;
  }

  const form = useForm<CompleteCV>({
    resolver: zodResolver(completeCvSchema),
    defaultValues: initialValues,
    mode: "onChange",
  });

  // Clear imported data after form is initialized
  useEffect(() => {
    // Remove imported data from session storage after form is initialized
    // to prevent it from being loaded again on refresh
    sessionStorage.removeItem('importedCVData');
  }, []);

  return form;
}
