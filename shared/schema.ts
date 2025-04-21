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
  photoUrl: text("photo_url"),
  summary: text("summary").notNull(),
  technicalSkills: text("technical_skills").array(),
  skills: text("skills").array(),
  templateType: text("template_type").default("professional"),
  includePhoto: boolean("include_photo").default(false),
  sectionOrder: jsonb("section_order"),
  accentColor: text("accent_color"),
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
export const extracurricularActivities = pgTable("extracurricular_activities", {
  id: serial("id").primaryKey(),
  cvId: integer("cv_id").notNull(),
  organization: text("organization").notNull(),
  role: text("role").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").default(false),
  description: text("description").notNull(),
});

export const insertExtracurricularActivitySchema = createInsertSchema(extracurricularActivities).omit({
  id: true,
});

export type InsertExtracurricularActivity = z.infer<typeof insertExtracurricularActivitySchema>;
export type ExtracurricularActivity = typeof extracurricularActivities.$inferSelect;

// Complete CV Schema with all sections for form submission
export const completeCvSchema = z.object({
  // Template preferences
  preferences: z.object({
    templateType: z.enum(["professional", "modern", "creative", "minimalist", "academic"]).default("professional"),
    includePhoto: z.boolean().default(false),
    accentColor: z.string().optional(),
    sectionOrder: z.object({
      sectionIds: z.array(z.string()).optional()
    }).optional()
  }).optional().default({}),
  
  // Personal information
  personal: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    linkedin: z.string().optional(),
    photoUrl: z.string().optional(),
  }),
  
  // Professional summary
  professional: z.object({
    summary: z.string().min(1, "Summary is required"),
  }),
  
  // Key competencies (technical skills)
  competencies: z.object({
    technicalSkills: z.array(z.string()).optional().default([]),
  }).optional().default({}),
  
  // Work experience
  experience: z.array(
    z.object({
      companyName: z.string().min(1, "Company name is required"),
      jobTitle: z.string().min(1, "Job title is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional().default(false),
      responsibilities: z.string().min(1, "Responsibilities are required"),
    })
  ).optional().default([]),
  
  // Education
  education: z.array(
    z.object({
      schoolName: z.string().min(1, "School name is required"),
      major: z.string().min(1, "Major is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      achievements: z.string().optional(),
    })
  ).optional().default([]),
  
  // Certificates
  certificates: z.array(
    z.object({
      institution: z.string().min(1, "Institution name is required"),
      name: z.string().min(1, "Certificate name is required"),
      dateAcquired: z.string().min(1, "Date acquired is required"),
      expirationDate: z.string().optional(),
      achievements: z.string().optional(),
    })
  ).optional().default([]),
  
  // Extracurricular activities
  extracurricular: z.array(
    z.object({
      organization: z.string().min(1, "Organization name is required"),
      role: z.string().min(1, "Role is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().optional(),
      isCurrent: z.boolean().optional().default(false),
      description: z.string().min(1, "Description is required"),
    })
  ).optional().default([]),
  
  // Additional info
  additional: z.object({
    skills: z.array(z.string()).optional().default([]),
  }).optional().default({}),
  
  // Languages
  languages: z.array(
    z.object({
      name: z.string().min(1, "Language name is required"),
      proficiency: z.string().min(1, "Proficiency level is required"),
    })
  ).optional().default([]),
});

export type CompleteCv = z.infer<typeof completeCvSchema>;
