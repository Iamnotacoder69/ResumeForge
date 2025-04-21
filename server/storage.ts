import {
  users, type User, type InsertUser,
  cvs, type Cv, type InsertCv,
  experiences, type Experience, type InsertExperience, 
  educations, type Education, type InsertEducation,
  certificates, type Certificate, type InsertCertificate,
  languages, type Language, type InsertLanguage,
  extracurricularActivities, type ExtracurricularActivity, type InsertExtracurricularActivity
} from "@shared/schema";
import { CompleteCV } from "@shared/types";

// Storage interface for CV application
export interface IStorage {
  // User operations (kept for reference)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // CV operations
  createCV(data: CompleteCV): Promise<number>;
  getCV(id: number): Promise<Cv | undefined>;
  getAllCVs(): Promise<Cv[]>;
  
  // Experience operations
  createExperience(experience: InsertExperience): Promise<Experience>;
  getExperiencesByCvId(cvId: number): Promise<Experience[]>;
  
  // Education operations
  createEducation(education: InsertEducation): Promise<Education>;
  getEducationsByCvId(cvId: number): Promise<Education[]>;
  
  // Certificate operations
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificatesByCvId(cvId: number): Promise<Certificate[]>;
  
  // Language operations
  createLanguage(language: InsertLanguage): Promise<Language>;
  getLanguagesByCvId(cvId: number): Promise<Language[]>;
  
  // Extracurricular Activity operations
  createExtracurricularActivity(activity: InsertExtracurricularActivity): Promise<ExtracurricularActivity>;
  getExtracurricularActivitiesByCvId(cvId: number): Promise<ExtracurricularActivity[]>;
  
  // Get complete CV with all related data
  getCompleteCV(id: number): Promise<CompleteCV | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cvs: Map<number, Cv>;
  private experiences: Map<number, Experience[]>;
  private educations: Map<number, Education[]>;
  private certificates: Map<number, Certificate[]>;
  private languages: Map<number, Language[]>;
  private extracurricular: Map<number, ExtracurricularActivity[]>;
  
  private userCurrentId: number;
  private cvCurrentId: number;
  private experienceCurrentId: number;
  private educationCurrentId: number;
  private certificateCurrentId: number;
  private languageCurrentId: number;
  private extracurricularCurrentId: number;

  constructor() {
    this.users = new Map();
    this.cvs = new Map();
    this.experiences = new Map();
    this.educations = new Map();
    this.certificates = new Map();
    this.languages = new Map();
    this.extracurricular = new Map();
    
    this.userCurrentId = 1;
    this.cvCurrentId = 1;
    this.experienceCurrentId = 1;
    this.educationCurrentId = 1;
    this.certificateCurrentId = 1;
    this.languageCurrentId = 1;
    this.extracurricularCurrentId = 1;
  }

  // User methods (kept for reference)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // CV methods
  async createCV(data: CompleteCV): Promise<number> {
    const id = this.cvCurrentId++;
    const createdAt = new Date();
    
    // Create CV record
    const cv: Cv = {
      id,
      firstName: data.personal.firstName,
      lastName: data.personal.lastName,
      email: data.personal.email,
      phone: data.personal.phone,
      linkedin: data.personal.linkedin,
      summary: data.professional.summary,
      skills: data.additional.skills,
      createdAt
    };
    
    this.cvs.set(id, cv);
    
    // Create experience records
    const experiences: Experience[] = data.experience.map((exp, index) => {
      const expId = this.experienceCurrentId++;
      return {
        id: expId,
        cvId: id,
        companyName: exp.companyName,
        jobTitle: exp.jobTitle,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent || false,
        responsibilities: exp.responsibilities
      };
    });
    
    this.experiences.set(id, experiences);
    
    // Create education records
    const educations: Education[] = data.education.map((edu) => {
      const eduId = this.educationCurrentId++;
      return {
        id: eduId,
        cvId: id,
        schoolName: edu.schoolName,
        major: edu.major,
        startDate: edu.startDate,
        endDate: edu.endDate,
        achievements: edu.achievements
      };
    });
    
    this.educations.set(id, educations);
    
    // Create certificate records
    if (data.certificates && data.certificates.length > 0) {
      const certificates: Certificate[] = data.certificates.map((cert) => {
        const certId = this.certificateCurrentId++;
        return {
          id: certId,
          cvId: id,
          institution: cert.institution,
          name: cert.name,
          dateAcquired: cert.dateAcquired,
          expirationDate: cert.expirationDate,
          achievements: cert.achievements
        };
      });
      
      this.certificates.set(id, certificates);
    }
    
    // Create language records
    const languages: Language[] = data.languages.map((lang) => {
      const langId = this.languageCurrentId++;
      return {
        id: langId,
        cvId: id,
        name: lang.name,
        proficiency: lang.proficiency
      };
    });
    
    this.languages.set(id, languages);
    
    return id;
  }
  
  async getCV(id: number): Promise<Cv | undefined> {
    return this.cvs.get(id);
  }
  
  async getAllCVs(): Promise<Cv[]> {
    return Array.from(this.cvs.values());
  }
  
  // Experience methods
  async createExperience(experience: InsertExperience): Promise<Experience> {
    const id = this.experienceCurrentId++;
    const newExperience: Experience = { ...experience, id };
    
    const cvExperiences = this.experiences.get(experience.cvId) || [];
    cvExperiences.push(newExperience);
    this.experiences.set(experience.cvId, cvExperiences);
    
    return newExperience;
  }
  
  async getExperiencesByCvId(cvId: number): Promise<Experience[]> {
    return this.experiences.get(cvId) || [];
  }
  
  // Education methods
  async createEducation(education: InsertEducation): Promise<Education> {
    const id = this.educationCurrentId++;
    const newEducation: Education = { ...education, id };
    
    const cvEducations = this.educations.get(education.cvId) || [];
    cvEducations.push(newEducation);
    this.educations.set(education.cvId, cvEducations);
    
    return newEducation;
  }
  
  async getEducationsByCvId(cvId: number): Promise<Education[]> {
    return this.educations.get(cvId) || [];
  }
  
  // Certificate methods
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const id = this.certificateCurrentId++;
    const newCertificate: Certificate = { ...certificate, id };
    
    const cvCertificates = this.certificates.get(certificate.cvId) || [];
    cvCertificates.push(newCertificate);
    this.certificates.set(certificate.cvId, cvCertificates);
    
    return newCertificate;
  }
  
  async getCertificatesByCvId(cvId: number): Promise<Certificate[]> {
    return this.certificates.get(cvId) || [];
  }
  
  // Language methods
  async createLanguage(language: InsertLanguage): Promise<Language> {
    const id = this.languageCurrentId++;
    const newLanguage: Language = { ...language, id };
    
    const cvLanguages = this.languages.get(language.cvId) || [];
    cvLanguages.push(newLanguage);
    this.languages.set(language.cvId, cvLanguages);
    
    return newLanguage;
  }
  
  async getLanguagesByCvId(cvId: number): Promise<Language[]> {
    return this.languages.get(cvId) || [];
  }
  
  // Extracurricular Activity methods
  async createExtracurricularActivity(activity: InsertExtracurricularActivity): Promise<ExtracurricularActivity> {
    const id = this.extracurricularCurrentId++;
    const newActivity: ExtracurricularActivity = { ...activity, id };
    
    const cvActivities = this.extracurricular.get(activity.cvId) || [];
    cvActivities.push(newActivity);
    this.extracurricular.set(activity.cvId, cvActivities);
    
    return newActivity;
  }
  
  async getExtracurricularActivitiesByCvId(cvId: number): Promise<ExtracurricularActivity[]> {
    return this.extracurricular.get(cvId) || [];
  }
  
  // Get complete CV with all related data
  async getCompleteCV(id: number): Promise<CompleteCV | undefined> {
    const cv = await this.getCV(id);
    if (!cv) return undefined;
    
    const experiences = await this.getExperiencesByCvId(id);
    const educations = await this.getEducationsByCvId(id);
    const certificates = await this.getCertificatesByCvId(id);
    const languages = await this.getLanguagesByCvId(id);
    
    return {
      personal: {
        firstName: cv.firstName,
        lastName: cv.lastName,
        email: cv.email,
        phone: cv.phone,
        linkedin: cv.linkedin,
      },
      professional: {
        summary: cv.summary,
      },
      experience: experiences.map(exp => ({
        companyName: exp.companyName,
        jobTitle: exp.jobTitle,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrent: exp.isCurrent,
        responsibilities: exp.responsibilities,
      })),
      education: educations.map(edu => ({
        schoolName: edu.schoolName,
        major: edu.major,
        startDate: edu.startDate,
        endDate: edu.endDate,
        achievements: edu.achievements,
      })),
      certificates: certificates.map(cert => ({
        institution: cert.institution,
        name: cert.name,
        dateAcquired: cert.dateAcquired,
        expirationDate: cert.expirationDate,
        achievements: cert.achievements,
      })),
      additional: {
        skills: cv.skills || [],
      },
      languages: languages.map(lang => ({
        name: lang.name,
        proficiency: lang.proficiency,
      })),
    };
  }
}

export const storage = new MemStorage();
