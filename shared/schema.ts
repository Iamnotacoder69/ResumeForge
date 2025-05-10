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
    firstName: z.string().default(""),
    lastName: z.string().default(""),
    professionalTitle: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    linkedin: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  professional: z.object({
    summary: z.string().default(""),
  }),
  keyCompetencies: z.object({
    technicalSkills: z.array(z.string()).default([]),
    softSkills: z.array(z.string()).default([]),
  }),
  experience: z.array(
    z.object({
      companyName: z.string().default(""),
      jobTitle: z.string().default(""),
      startDate: z.string().default(""),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional().default(false),
      responsibilities: z.string().default(""),
    })
  ).default([]),
  education: z.array(
    z.object({
      schoolName: z.string().default(""),
      major: z.string().default(""),
      startDate: z.string().default(""),
      endDate: z.string().default(""),
      achievements: z.string().optional(),
    })
  ).default([]),
  certificates: z.array(
    z.object({
      institution: z.string().default(""),
      name: z.string().default(""),
      dateAcquired: z.string().default(""),
      expirationDate: z.string().optional(),
      achievements: z.string().optional(),
    })
  ).default([]),
  extracurricular: z.array(
    z.object({
      organization: z.string().default(""),
      role: z.string().default(""),
      startDate: z.string().default(""),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional().default(false),
      description: z.string().default(""),
    })
  ).default([]),
  additional: z.object({
    skills: z.array(z.string()).default([]),
  }),
  languages: z.array(
    z.object({
      name: z.string().default(""),
      proficiency: z.string().default("intermediate"),
    })
  ).default([]),
  templateSettings: z.object({
    template: z.enum(['professional', 'modern', 'minimal']).default("professional"),
    includePhoto: z.boolean().default(false),
    sectionOrder: z.array(
      z.object({
        id: z.enum(['personal', 'summary', 'keyCompetencies', 'experience', 'education', 'certificates', 'extracurricular', 'additional']),
        name: z.string(),
        visible: z.boolean().default(true),
        order: z.number(),
      })
    ).default([
      { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
      { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
      { id: 'experience', name: 'Work Experience', visible: true, order: 2 },
      { id: 'education', name: 'Education', visible: true, order: 3 },
      { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
      { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
      { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
    ]),
  }).default({}),
});

export type CompleteCv = z.infer<typeof completeCvSchema>;
