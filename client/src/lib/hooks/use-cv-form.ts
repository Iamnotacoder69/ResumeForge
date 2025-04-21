import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeCvSchema } from "@shared/schema";
import { CompleteCV } from "@shared/types";

export function useCVForm() {
  const defaultValues: CompleteCV = {
    personal: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      linkedin: "",
    },
    professional: {
      summary: "",
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
    additional: {
      skills: [],
    },
    languages: [
      {
        name: "",
        proficiency: "intermediate",
      },
    ],
  };

  const form = useForm<CompleteCV>({
    resolver: zodResolver(completeCvSchema),
    defaultValues,
    mode: "onChange",
  });

  return form;
}
