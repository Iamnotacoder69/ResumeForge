import { z } from "zod";
import { completeCvSchema } from "./schema";

export type TemplateType = 'minimalist' | 'professional' | 'creative' | 'academic';

export type SectionType = 'personal' | 'summary' | 'keyCompetencies' | 'experience' | 'education' | 'certificates' | 'extracurricular' | 'additional';

export type SectionOrder = {
  id: SectionType;
  name: string;
  visible: boolean;
  order: number;
};

export type ProficiencyLevel = "native" | "fluent" | "advanced" | "intermediate" | "basic";

export type Language = {
  id?: number;
  name: string;
  proficiency: ProficiencyLevel;
};

export type Experience = {
  id?: number;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities: string;
};

export type Education = {
  id?: number;
  schoolName: string;
  major: string;
  startDate: string;
  endDate: string;
  achievements?: string;
};

export type Certificate = {
  id?: number;
  institution: string;
  name: string;
  dateAcquired: string;
  expirationDate?: string;
  achievements?: string;
};

export type Extracurricular = {
  id?: number;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description: string;
};

export type PersonalInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedin?: string;
  photoUrl?: string; // For photo inclusion option
};

export type ProfessionalSummary = {
  summary: string;
};

export type KeyCompetencies = {
  technicalSkills: string[];
  softSkills: string[];
};

export type AdditionalInfo = {
  skills: string[];
};

export type TemplateSettings = {
  template: TemplateType;
  includePhoto: boolean;
  sectionOrder: SectionOrder[];
};

export type CompleteCV = z.infer<typeof completeCvSchema>;

export type AIRewriteRequest = {
  text: string;
  type: "summary" | "responsibilities";
};

export type AIRewriteResponse = {
  enhancedText: string;
};
