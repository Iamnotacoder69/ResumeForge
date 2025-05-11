import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { enhanceTextWithAI } from "./openai";
import { processUploadedCV } from "./upload";
import { extractDataFromCV } from "./cv-extractor";
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

  // Server-side PDF Generation using HTML2PDF API
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    try {
      const cvData = req.body;
      console.log("Received request to generate PDF for CV", cvData.templateSettings?.template);
      
      // Get HTML2PDF API key from environment
      const apiKey = process.env.HTML2PDF_API_KEY;
      if (!apiKey) {
        throw new Error("HTML2PDF_API_KEY environment variable is not set");
      }
      
      // For this demo, we'll use html parameter instead of URL
      // We'll create a simple HTML representation of the CV data
      // In a real-world scenario, we would render a proper HTML template
      
      // Create a simplified HTML version of the CV
      const html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${cvData.personal?.firstName || ''} ${cvData.personal?.lastName || ''} - CV</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            h1 { color: #043e44; margin: 0; }
            h2 { color: #043e44; border-bottom: 2px solid #03d27c; padding-bottom: 5px; margin-top: 20px; }
            .contact-info { margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .experience-item, .education-item { margin-bottom: 15px; }
            .job-title, .degree { font-weight: bold; }
            .company, .school { font-style: italic; }
            .period { color: #666; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
            .skill-item { background: #f0f0f0; padding: 5px 10px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${cvData.personal?.firstName || ''} ${cvData.personal?.lastName || ''}</h1>
            <p>${cvData.personal?.professionalTitle || ''}</p>
            <div class="contact-info">
              ${cvData.personal?.email ? `<p>Email: ${cvData.personal.email}</p>` : ''}
              ${cvData.personal?.phone ? `<p>Phone: ${cvData.personal.phone}</p>` : ''}
              ${cvData.personal?.linkedin ? `<p>LinkedIn: ${cvData.personal.linkedin}</p>` : ''}
            </div>
          </div>
          
          ${cvData.professional?.summary ? `
            <div class="section">
              <h2>Professional Summary</h2>
              <p>${cvData.professional.summary}</p>
            </div>
          ` : ''}
          
          ${cvData.keyCompetencies && (cvData.keyCompetencies.technicalSkills.length > 0 || cvData.keyCompetencies.softSkills.length > 0) ? `
            <div class="section">
              <h2>Key Competencies</h2>
              ${cvData.keyCompetencies.technicalSkills.length > 0 ? `
                <h3>Technical Skills</h3>
                <div class="skills-list">
                  ${cvData.keyCompetencies.technicalSkills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                </div>
              ` : ''}
              ${cvData.keyCompetencies.softSkills.length > 0 ? `
                <h3>Soft Skills</h3>
                <div class="skills-list">
                  ${cvData.keyCompetencies.softSkills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}
          
          ${cvData.experience && cvData.experience.length > 0 ? `
            <div class="section">
              <h2>Work Experience</h2>
              ${cvData.experience.map(exp => `
                <div class="experience-item">
                  <div class="job-title">${exp.jobTitle}</div>
                  <div class="company">${exp.companyName}</div>
                  <div class="period">${exp.startDate} - ${exp.isCurrent ? 'Present' : exp.endDate || ''}</div>
                  <p>${exp.responsibilities}</p>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${cvData.education && cvData.education.length > 0 ? `
            <div class="section">
              <h2>Education</h2>
              ${cvData.education.map(edu => `
                <div class="education-item">
                  <div class="degree">${edu.major}</div>
                  <div class="school">${edu.schoolName}</div>
                  <div class="period">${edu.startDate} - ${edu.endDate || ''}</div>
                  ${edu.achievements ? `<p>${edu.achievements}</p>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
        </html>
      `;
      
      const response = await fetch('https://api.html2pdf.app/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html: html,
          apiKey: apiKey,
          // Optional parameters for PDF generation
          paperWidth: 8.3, // A4 width in inches
          paperHeight: 11.7, // A4 height in inches
          marginTop: 0.4,
          marginRight: 0.4,
          marginBottom: 0.4,
          marginLeft: 0.4
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTML2PDF API error: ${response.status} ${errorText}`);
      }
      
      // Get the response as an ArrayBuffer
      const pdfBuffer = await response.arrayBuffer();
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${cvData.personal?.firstName || 'cv'}_${cvData.personal?.lastName || ''}.pdf"`);
      
      // Send the PDF data
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      console.error("Error generating PDF:", error);
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
