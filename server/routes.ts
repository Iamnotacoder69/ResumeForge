import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { enhanceTextWithAI } from "./openai";
import { processUploadedCV } from "./upload";
import { extractDataFromCV } from "./cv-extractor";
import { generatePDF } from "./pdf-generator";
import { completeCvSchema } from "@shared/schema";
import { AIRewriteRequest } from "@shared/types";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // CV Routes
  
  // Submit CV - Create a new CV entry with all related data
  app.post("/api/cv", async (req: Request, res: Response) => {
    try {
      const validatedData = completeCvSchema.parse(req.body);
      const cvId = await storage.createCV(validatedData);
      
      res.status(201).json({ 
        success: true, 
        message: "CV created successfully", 
        data: { id: cvId } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Failed to create CV", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get all CVs
  app.get("/api/cv", async (req: Request, res: Response) => {
    try {
      const cvs = await storage.getAllCVs();
      res.status(200).json({ success: true, data: cvs });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve CVs", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Get a specific CV by ID
  app.get("/api/cv/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid CV ID" });
      }
      
      const cv = await storage.getCompleteCV(id);
      if (!cv) {
        return res.status(404).json({ success: false, message: "CV not found" });
      }
      
      res.status(200).json({ success: true, data: cv });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve CV", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // AI Text Enhancement
  app.post("/api/enhance-text", async (req: Request, res: Response) => {
    try {
      const { text, type } = req.body as AIRewriteRequest;
      
      if (!text || !type) {
        return res.status(400).json({ 
          success: false, 
          message: "Text and type are required" 
        });
      }
      
      if (type !== "summary" && type !== "responsibilities") {
        return res.status(400).json({ 
          success: false, 
          message: "Type must be either 'summary' or 'responsibilities'" 
        });
      }
      
      const enhancedText = await enhanceTextWithAI(text, type);
      
      res.status(200).json({ 
        success: true, 
        data: { enhancedText } 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to enhance text with AI", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Validate CV Data for PDF Generation (client-side PDF generation)
  app.post("/api/validate-cv", async (req: Request, res: Response) => {
    try {
      console.log("CV Validation - Request received");
      
      // Log debugging info about the CV data
      console.log("CV Validation - Template:", req.body.templateSettings?.template);
      console.log("CV Validation - Has Key Competencies:", !!req.body.keyCompetencies);
      console.log("CV Validation - Has Extracurricular:", !!req.body.extracurricular);
      
      // For preview mode, use a relaxed parsing that allows empty fields
      let data;
      
      try {
        // Try to validate with the regular schema
        data = completeCvSchema.parse(req.body);
        console.log("CV Validation - CV data passed validation");
      } catch (validationError) {
        console.log("CV validation issues detected, using relaxed mode for preview");
        
        // Create default data structure with empty values for missing fields
        data = {
          personal: { 
            firstName: req.body.personal?.firstName || "",
            lastName: req.body.personal?.lastName || "",
            professionalTitle: req.body.personal?.professionalTitle || "",
            email: req.body.personal?.email || "",
            phone: req.body.personal?.phone || "",
            linkedin: req.body.personal?.linkedin || "",
            photoUrl: req.body.personal?.photoUrl || ""
          },
          professional: { 
            summary: req.body.professional?.summary || ""
          },
          keyCompetencies: {
            technicalSkills: req.body.keyCompetencies?.technicalSkills || [],
            softSkills: req.body.keyCompetencies?.softSkills || []
          },
          experience: req.body.experience || [],
          education: req.body.education || [],
          certificates: req.body.certificates || [],
          extracurricular: req.body.extracurricular || [],
          additional: { 
            skills: req.body.additional?.skills || []
          },
          languages: req.body.languages || [],
          templateSettings: {
            template: req.body.templateSettings?.template || "professional",
            includePhoto: req.body.templateSettings?.includePhoto || false,
            sectionOrder: req.body.templateSettings?.sectionOrder || [
              { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
              { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
              { id: 'experience', name: 'Work Experience', visible: true, order: 2 },
              { id: 'education', name: 'Education', visible: true, order: 3 },
              { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
              { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
              { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
            ]
          }
        };
      }
      
      // Return validated data for client-side PDF generation
      res.status(200).json({
        success: true,
        message: "CV data validated successfully",
        data
      });
      
    } catch (error) {
      console.error("CV Validation - Error caught:", error);
      
      if (error instanceof z.ZodError) {
        console.log("CV Validation - Validation error");
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: fromZodError(error).message 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Failed to validate CV data", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Upload CV Document
  app.post("/api/upload-cv", upload.single('cvFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Only PDF and DOCX files are supported"
        });
      }

      // Process the uploaded CV file
      const { textContent } = await processUploadedCV(req.file);

      // Return the text content
      res.status(200).json({
        success: true,
        message: "File processed successfully",
        textContent
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to process uploaded CV",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Extract CV Data
  app.post("/api/extract-cv-data", async (req: Request, res: Response) => {
    try {
      const { textContent } = req.body;

      if (!textContent) {
        return res.status(400).json({
          success: false,
          message: "Text content is required"
        });
      }

      // Extract structured data from CV text
      const extractedData = await extractDataFromCV(textContent);
      
      console.log("Successfully created complete CV data");
      
      // Return data in a standard format
      res.status(200).json({
        success: true,
        message: "Data extracted successfully",
        data: extractedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to extract data from CV",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
