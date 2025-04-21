import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeCvSchema } from "@shared/schema";
import { CompleteCV, TemplateType } from "@shared/types";

export function useCVForm() {
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
    competencies: {
      technicalSkills: [],
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
    preferences: {
      templateType: "professional" as TemplateType,
      includePhoto: false,
      sectionOrder: {
        sectionIds: [
          'experience', 'education', 'competencies', 'certificates', 'extracurricular'
        ]
      }
    }
  };

  const form = useForm<CompleteCV>({
    resolver: zodResolver(completeCvSchema),
    defaultValues,
    mode: "onChange",
  });

  return form;
}
