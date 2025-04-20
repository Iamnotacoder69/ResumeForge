import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePDF } from "./pdf";
import { enhanceTextWithAI } from "./openai";
import { completeCvSchema } from "@shared/schema";
import { AIRewriteRequest } from "@shared/types";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

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
  
  // Generate PDF
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    try {
      const validatedData = completeCvSchema.parse(req.body);
      
      // Generate PDF buffer
      const pdfBuffer = await generatePDF(validatedData);
      
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
