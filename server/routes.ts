import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePDF } from "./pdf";
import { enhanceTextWithAI } from "./openai";
import { parseCV } from "./cv-parser";
import { completeCvSchema } from "@shared/schema";
import { AIRewriteRequest } from "@shared/types";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { upload } from "./index";

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
      
      // Input validation
      if (!text) {
        console.log("Empty text submitted for enhancement");
        return res.status(200).json({ 
          success: true, 
          data: { enhancedText: text || "" } 
        });
      }
      
      // Validate type
      const validType = (type === "summary" || type === "responsibilities") ? type : "summary";
      
      console.log(`Enhancing text (${text.length} chars) with type: ${validType}`);
      
      try {
        // Use the AI enhancement with better error handling
        const enhancedText = await enhanceTextWithAI(text, validType);
        
        res.status(200).json({ 
          success: true, 
          data: { enhancedText } 
        });
      } catch (aiError) {
        // Even if AI enhancement fails, we return the original text
        console.error("AI enhancement failed, returning original text:", aiError);
        res.status(200).json({ 
          success: true, 
          data: { enhancedText: text } 
        });
      }
    } catch (error) {
      console.error("Error processing enhancement request:", error);
      // Always return a valid response to avoid breaking the client
      res.status(200).json({ 
        success: true, 
        message: "Processing error, using original text", 
        data: { enhancedText: req.body?.text || "" } 
      });
    }
  });
  
  // CV Upload and Parse
  app.post("/api/upload-cv", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No file uploaded" 
        });
      }
      
      console.log(`Processing uploaded file: ${req.file.originalname}, type: ${req.file.mimetype}, size: ${req.file.size} bytes`);
      
      // Process file based on type
      const parsedCV = await parseCV(req.file.buffer, req.file.mimetype);
      
      // Return the parsed CV data - we will always return success now as the parseCV
      // function will not throw errors but instead return a fallback structure
      res.status(200).json({ 
        success: true, 
        message: "CV parsed successfully", 
        data: parsedCV 
      });
    } catch (error) {
      console.error("Error parsing CV:", error);
      
      // This shouldn't happen now since parseCV has its own error handling, but just in case
      res.status(200).json({
        success: true,
        message: "Could not fully parse CV, but created blank template for you",
        data: {
          personal: { firstName: "", lastName: "", email: "", phone: "", linkedin: "" },
          professional: { summary: "" },
          keyCompetencies: { technicalSkills: [], softSkills: [] },
          experience: [],
          education: [],
          certificates: [],
          extracurricular: [],
          additional: { skills: [] },
          languages: [],
          templateSettings: {
            template: 'professional',
            includePhoto: false,
            sectionOrder: [
              { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
              { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
              { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
              { id: 'experience', name: 'Experience', visible: true, order: 3 },
              { id: 'education', name: 'Education', visible: true, order: 4 },
              { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
              { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
              { id: 'additional', name: 'Additional Information', visible: true, order: 7 },
            ]
          }
        }
      });
    }
  });

  // Generate PDF
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    try {
      // Add debugging logs
      console.log("PDF Generation - Template:", req.body.templateSettings?.template);
      console.log("PDF Generation - Has Key Competencies:", !!req.body.keyCompetencies);
      console.log("PDF Generation - Has Extracurricular:", !!req.body.extracurricular);
      console.log("PDF Generation - Sections:", req.body.templateSettings?.sectionOrder?.map((s: any) => s.id));
      
      // For preview mode, use a relaxed parsing that allows empty fields
      // instead of rejecting the entire request
      let data;
      
      try {
        // Try to validate with the regular schema
        data = completeCvSchema.parse(req.body);
      } catch (validationError) {
        console.log("PDF validation issues detected, using relaxed mode for preview");
        
        // Create default data structure with empty values
        data = {
          personal: { 
            firstName: req.body.personal?.firstName || "",
            lastName: req.body.personal?.lastName || "",
            email: req.body.personal?.email || "",
            phone: req.body.personal?.phone || "",
            linkedin: req.body.personal?.linkedin || ""
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
      
      // Generate PDF buffer
      const pdfBuffer = await generatePDF(data);
      
      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=cv.pdf');
      
      // Send PDF buffer
      res.status(200).send(pdfBuffer);
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
        message: "Failed to generate PDF", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
