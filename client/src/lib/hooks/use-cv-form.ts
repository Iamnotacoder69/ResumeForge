import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeCvSchema } from "@shared/schema";
import { CompleteCV, SectionOrder } from "@shared/types";

export function useCVForm(initialData?: Partial<CompleteCV>) {
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

  // Merge initial data with default values if provided
  const mergedValues = initialData 
    ? {
        ...defaultValues,
        ...initialData,
        // Handle nested objects manually to ensure proper merging
        personal: { ...defaultValues.personal, ...initialData.personal },
        professional: { ...defaultValues.professional, ...initialData.professional },
        keyCompetencies: { ...defaultValues.keyCompetencies, ...initialData.keyCompetencies },
        additional: { ...defaultValues.additional, ...initialData.additional },
        templateSettings: { 
          ...defaultValues.templateSettings, 
          ...initialData.templateSettings,
          // Ensure section order is properly merged
          sectionOrder: initialData.templateSettings?.sectionOrder || defaultSectionOrder
        }
      } 
    : defaultValues;
  
  const form = useForm<CompleteCV>({
    resolver: zodResolver(completeCvSchema),
    defaultValues: mergedValues,
    mode: "onChange",
  });

  return form;
}
