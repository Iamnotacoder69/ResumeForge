import { 
  users, type User, type InsertUser, 
  cvs, type Cv, type InsertCv,
  experiences, type Experience, type InsertExperience,
  educations, type Education, type InsertEducation,
  certificates, type Certificate, type InsertCertificate,
  languages, type Language, type InsertLanguage,
  extracurricular, type Extracurricular, type InsertExtracurricular
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage } from "./storage";
import { CompleteCV } from "@shared/types";

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // CV operations
  async createCV(data: CompleteCV): Promise<number> {
    // Extract basic CV data
    const cvData: InsertCv = {
      title: `${data.personal.firstName} ${data.personal.lastName}'s CV`,
      templateType: data.templateSettings.template,
      includePhoto: data.templateSettings.includePhoto,
      firstName: data.personal.firstName,
      lastName: data.personal.lastName,
      email: data.personal.email,
      phone: data.personal.phone,
      linkedin: data.personal.linkedin || null,
      photoUrl: data.personal.photoUrl || null,
      summary: data.professional?.summary || null,
      technicalSkills: data.keyCompetencies?.technicalSkills || [],
      softSkills: data.keyCompetencies?.softSkills || [],
      additionalSkills: data.additional?.skills || [],
      sectionOrder: JSON.stringify(data.templateSettings.sectionOrder || []),
    };

    // Insert the CV
    const [cv] = await db.insert(cvs).values(cvData).returning();
    const cvId = cv.id;

    // Insert experiences
    if (data.experience && Array.isArray(data.experience)) {
      for (const exp of data.experience) {
        await this.createExperience({
          cvId,
          companyName: exp.companyName,
          jobTitle: exp.jobTitle,
          startDate: exp.startDate,
          endDate: exp.endDate || null,
          isCurrent: exp.isCurrent || false,
          responsibilities: exp.responsibilities
        });
      }
    }

    // Insert educations
    if (data.education && Array.isArray(data.education)) {
      for (const edu of data.education) {
        await this.createEducation({
          cvId,
          schoolName: edu.schoolName,
          major: edu.major,
          startDate: edu.startDate,
          endDate: edu.endDate,
          achievements: edu.achievements || null
        });
      }
    }

    // Insert certificates
    if (data.certificates && Array.isArray(data.certificates)) {
      for (const cert of data.certificates) {
        await this.createCertificate({
          cvId,
          institution: cert.institution,
          name: cert.name,
          dateAcquired: cert.dateAcquired,
          expirationDate: cert.expirationDate || null,
          achievements: cert.achievements || null
        });
      }
    }

    // Insert languages
    if (data.languages && Array.isArray(data.languages)) {
      for (const lang of data.languages) {
        await this.createLanguage({
          cvId,
          name: lang.name,
          proficiency: lang.proficiency
        });
      }
    }

    // Insert extracurricular activities
    if (data.extracurricular && Array.isArray(data.extracurricular)) {
      for (const extra of data.extracurricular) {
        await this.createExtracurricular({
          cvId,
          organization: extra.organization,
          role: extra.role,
          startDate: extra.startDate,
          endDate: extra.endDate || null,
          isCurrent: extra.isCurrent || false,
          description: extra.description
        });
      }
    }

    return cvId;
  }

  async getCV(id: number): Promise<Cv | undefined> {
    const [cv] = await db.select().from(cvs).where(eq(cvs.id, id));
    return cv || undefined;
  }

  async getAllCVs(): Promise<Cv[]> {
    return await db.select().from(cvs);
  }

  // Experience operations
  async createExperience(experience: InsertExperience): Promise<Experience> {
    const [newExperience] = await db
      .insert(experiences)
      .values(experience)
      .returning();
    return newExperience;
  }

  async getExperiencesByCvId(cvId: number): Promise<Experience[]> {
    return await db
      .select()
      .from(experiences)
      .where(eq(experiences.cvId, cvId));
  }

  // Education operations
  async createEducation(education: InsertEducation): Promise<Education> {
    const [newEducation] = await db
      .insert(educations)
      .values(education)
      .returning();
    return newEducation;
  }

  async getEducationsByCvId(cvId: number): Promise<Education[]> {
    return await db
      .select()
      .from(educations)
      .where(eq(educations.cvId, cvId));
  }

  // Certificate operations
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db
      .insert(certificates)
      .values(certificate)
      .returning();
    return newCertificate;
  }

  async getCertificatesByCvId(cvId: number): Promise<Certificate[]> {
    return await db
      .select()
      .from(certificates)
      .where(eq(certificates.cvId, cvId));
  }

  // Language operations
  async createLanguage(language: InsertLanguage): Promise<Language> {
    const [newLanguage] = await db
      .insert(languages)
      .values(language)
      .returning();
    return newLanguage;
  }

  async getLanguagesByCvId(cvId: number): Promise<Language[]> {
    return await db
      .select()
      .from(languages)
      .where(eq(languages.cvId, cvId));
  }

  // Extracurricular operations
  async createExtracurricular(extra: InsertExtracurricular): Promise<Extracurricular> {
    const [newExtra] = await db
      .insert(extracurricular)
      .values(extra)
      .returning();
    return newExtra;
  }

  async getExtracurricularByCvId(cvId: number): Promise<Extracurricular[]> {
    return await db
      .select()
      .from(extracurricular)
      .where(eq(extracurricular.cvId, cvId));
  }

  // Get complete CV with all related data
  async getCompleteCV(id: number): Promise<CompleteCV | undefined> {
    // Get the base CV data
    const cv = await this.getCV(id);
    if (!cv) return undefined;

    // Get all related data
    const experiences = await this.getExperiencesByCvId(id);
    const educations = await this.getEducationsByCvId(id);
    const certificates = await this.getCertificatesByCvId(id);
    const languages = await this.getLanguagesByCvId(id);
    const extracurricularActivities = await this.getExtracurricularByCvId(id);

    // Parse the section order JSON
    let sectionOrder;
    try {
      sectionOrder = JSON.parse(cv.sectionOrder || '[]');
    } catch (e) {
      console.error('Error parsing section order:', e);
      sectionOrder = [];
    }

    // Construct the complete CV
    const completeCV: CompleteCV = {
      personal: {
        firstName: cv.firstName,
        lastName: cv.lastName,
        email: cv.email,
        phone: cv.phone,
        linkedin: cv.linkedin || undefined,
        photoUrl: cv.photoUrl || undefined,
      },
      professional: {
        summary: cv.summary || '',
      },
      keyCompetencies: {
        technicalSkills: cv.technicalSkills || [],
        softSkills: cv.softSkills || [],
      },
      experience: experiences.map(exp => ({
        id: exp.id,
        companyName: exp.companyName,
        jobTitle: exp.jobTitle,
        startDate: exp.startDate,
        endDate: exp.endDate || undefined,
        isCurrent: exp.isCurrent,
        responsibilities: exp.responsibilities,
      })),
      education: educations.map(edu => ({
        id: edu.id,
        schoolName: edu.schoolName,
        major: edu.major,
        startDate: edu.startDate,
        endDate: edu.endDate,
        achievements: edu.achievements || undefined,
      })),
      certificates: certificates.map(cert => ({
        id: cert.id,
        institution: cert.institution,
        name: cert.name,
        dateAcquired: cert.dateAcquired,
        expirationDate: cert.expirationDate || undefined,
        achievements: cert.achievements || undefined,
      })),
      languages: languages.map(lang => ({
        id: lang.id,
        name: lang.name,
        proficiency: lang.proficiency,
      })),
      extracurricular: extracurricularActivities.map(extra => ({
        id: extra.id,
        organization: extra.organization,
        role: extra.role,
        startDate: extra.startDate,
        endDate: extra.endDate || undefined,
        isCurrent: extra.isCurrent,
        description: extra.description,
      })),
      additional: {
        skills: cv.additionalSkills || [],
      },
      templateSettings: {
        template: cv.templateType,
        includePhoto: cv.includePhoto,
        sectionOrder: sectionOrder,
      },
    };

    return completeCV;
  }
}