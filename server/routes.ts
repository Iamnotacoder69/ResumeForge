import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import * as os from "os";
import multer from "multer";
import { storage } from "./storage";
import { generatePDF } from "./pdf";
import { enhanceTextWithAI } from "./openai";
import { parseCV } from "./openai-cv-parser";
import { completeCvSchema } from "@shared/schema";
import { AIRewriteRequest } from "@shared/types";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, os.tmpdir()); // Use system temp directory
    },
    filename: (req, file, cb) => {
      // Generate a secure random filename
      const uniquePrefix = crypto.randomBytes(16).toString("hex");
      const fileExt = path.extname(file.originalname);
      cb(null, `${uniquePrefix}${fileExt}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF and Word documents
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
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
  
  // Parse CV file and extract information
  app.post("/api/parse-cv", upload.single('cv'), async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }
      
      // Parse CV file
      try {
        // Get file info
        const filePath = req.file.path;
        const fileType = req.file.mimetype;
        
        // Parse using OpenAI
        const parsedCV = await parseCV(filePath, fileType);
        
        // Return structured data
        res.status(200).json({
          success: true,
          data: parsedCV
        });
      } catch (error) {
        // Make sure to clean up the temp file if an error occurs
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (unlinkError) {
            console.error("Failed to delete temporary file:", unlinkError);
          }
        }
        
        throw error;
      }
    } catch (error) {
      console.error("Error in /api/parse-cv:", error);
      res.status(500).json({
        success: false,
        message: "Failed to parse CV",
        error: error instanceof Error ? error.message : "Unknown error"
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
