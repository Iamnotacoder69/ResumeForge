import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema kept for reference
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// CV schema
export const cvs = pgTable("cvs", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  linkedin: text("linkedin"),
  summary: text("summary").notNull(),
  skills: text("skills").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCvSchema = createInsertSchema(cvs).omit({
  id: true,
  createdAt: true,
});

export type InsertCv = z.infer<typeof insertCvSchema>;
export type Cv = typeof cvs.$inferSelect;

// Experience schema
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  companyName: text("company_name").notNull(),
  jobTitle: text("job_title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").default(false),
  responsibilities: text("responsibilities").notNull(),
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
});

export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiences.$inferSelect;

// Education schema
export const educations = pgTable("educations", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  schoolName: text("school_name").notNull(),
  major: text("major").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  achievements: text("achievements"),
});

export const insertEducationSchema = createInsertSchema(educations).omit({
  id: true,
});

export type InsertEducation = z.infer<typeof insertEducationSchema>;
export type Education = typeof educations.$inferSelect;

// Certificate schema
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  institution: text("institution").notNull(),
  name: text("name").notNull(),
  dateAcquired: text("date_acquired").notNull(),
  expirationDate: text("expiration_date"),
  achievements: text("achievements"),
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
});

export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Language schema
export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  name: text("name").notNull(),
  proficiency: text("proficiency").notNull(),
});

export const insertLanguageSchema = createInsertSchema(languages).omit({
  id: true,
});

export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Language = typeof languages.$inferSelect;

// Extracurricular Activities schema
export const extracurricular = pgTable("extracurricular", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  organization: text("organization").notNull(),
  role: text("role").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description").notNull(),
});

export const insertExtracurricularSchema = createInsertSchema(extracurricular).omit({
  id: true,
});

export type InsertExtracurricular = z.infer<typeof insertExtracurricularSchema>;
export type Extracurricular = typeof extracurricular.$inferSelect;

// Template Settings
export const templateSettings = pgTable("template_settings", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  template: text("template").notNull(),
  includePhoto: boolean("include_photo").default(false),
  photoUrl: text("photo_url"),
  sectionOrder: jsonb("section_order").notNull(),
});

export const insertTemplateSettingsSchema = createInsertSchema(templateSettings).omit({
  id: true,
});

export type InsertTemplateSettings = z.infer<typeof insertTemplateSettingsSchema>;
export type TemplateSettings = typeof templateSettings.$inferSelect;

// Complete CV Schema with all sections for form submission
export const completeCvSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    linkedin: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  professional: z.object({
    summary: z.string().min(1, "Summary is required"),
  }),
  keyCompetencies: z.object({
    technicalSkills: z.array(z.string()).default([]),
    softSkills: z.array(z.string()).default([]),
  }),
  experience: z.array(
    z.object({
      companyName: z.string().min(1, "Company name is required"),
      jobTitle: z.string().min(1, "Job title is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional().default(false),
      responsibilities: z.string().min(1, "Responsibilities are required"),
    })
  ).optional(),
  education: z.array(
    z.object({
      schoolName: z.string().min(1, "School name is required"),
      major: z.string().min(1, "Major is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      achievements: z.string().optional(),
    })
  ).optional(),
  certificates: z.array(
    z.object({
      institution: z.string().min(1, "Institution name is required"),
      name: z.string().min(1, "Certificate name is required"),
      dateAcquired: z.string().min(1, "Date acquired is required"),
      expirationDate: z.string().optional(),
      achievements: z.string().optional(),
    })
  ).optional(),
  extracurricular: z.array(
    z.object({
      organization: z.string().min(1, "Organization name is required"),
      role: z.string().min(1, "Role is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional().default(false),
      description: z.string().min(1, "Description is required"),
    })
  ).optional(),
  additional: z.object({
    skills: z.array(z.string()).optional(),
  }).optional(),
  languages: z.array(
    z.object({
      name: z.string().min(1, "Language name is required"),
      proficiency: z.string().min(1, "Proficiency level is required"),
    })
  ).optional(),
  templateSettings: z.object({
    template: z.enum(['minimalist', 'professional', 'creative', 'academic']).default("professional"),
    includePhoto: z.boolean().default(false),
    sectionOrder: z.array(
      z.object({
        id: z.enum(['personal', 'summary', 'keyCompetencies', 'experience', 'education', 'certificates', 'extracurricular', 'additional']),
        name: z.string(),
        visible: z.boolean(),
        order: z.number(),
      })
    ).optional(),
  }).optional(),
});

export type CompleteCv = z.infer<typeof completeCvSchema>;
