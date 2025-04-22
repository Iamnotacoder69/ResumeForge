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

  const form = useForm<CompleteCV>({
    resolver: zodResolver(completeCvSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Check for parsed CV data in sessionStorage and populate the form
  useEffect(() => {
    try {
      const parsedCVString = sessionStorage.getItem("parsedCV");
      if (parsedCVString) {
        const parsedCV = JSON.parse(parsedCVString);
        
        // Populate the form with parsed data
        console.log("Populating form with parsed CV data");
        
        // Set personal info
        if (parsedCV.personal) {
          Object.keys(parsedCV.personal).forEach(field => {
            if (parsedCV.personal[field]) {
              form.setValue(`personal.${field}` as any, parsedCV.personal[field]);
            }
          });
        }
        
        // Set professional summary
        if (parsedCV.professional?.summary) {
          form.setValue('professional.summary', parsedCV.professional.summary);
        }
        
        // Set key competencies
        if (parsedCV.keyCompetencies) {
          if (parsedCV.keyCompetencies.technicalSkills?.length) {
            form.setValue('keyCompetencies.technicalSkills', parsedCV.keyCompetencies.technicalSkills);
          }
          if (parsedCV.keyCompetencies.softSkills?.length) {
            form.setValue('keyCompetencies.softSkills', parsedCV.keyCompetencies.softSkills);
          }
        }
        
        // Set experience entries
        if (parsedCV.experience?.length) {
          form.setValue('experience', parsedCV.experience);
        }
        
        // Set education entries
        if (parsedCV.education?.length) {
          form.setValue('education', parsedCV.education);
        }
        
        // Set certificate entries
        if (parsedCV.certificates?.length) {
          form.setValue('certificates', parsedCV.certificates);
        }
        
        // Set language entries
        if (parsedCV.languages?.length) {
          form.setValue('languages', parsedCV.languages);
        }
        
        // Set extracurricular entries
        if (parsedCV.extracurricular?.length) {
          form.setValue('extracurricular', parsedCV.extracurricular);
        }
        
        // Set additional skills
        if (parsedCV.additional?.skills?.length) {
          form.setValue('additional.skills', parsedCV.additional.skills);
        }
        
        // Set template settings
        if (parsedCV.templateSettings) {
          form.setValue('templateSettings', {
            ...parsedCV.templateSettings,
            sectionOrder: parsedCV.templateSettings.sectionOrder || defaultSectionOrder
          });
        }
        
        // Clean up session storage after loading data
        sessionStorage.removeItem("parsedCV");
      }
    } catch (error) {
      console.error("Error loading parsed CV data:", error);
    }
  }, [form]);

  return form;
}
