import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import * as pdf from 'html-pdf-node';
import { CompleteCV } from "@shared/types";

// Register Handlebars helpers
Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

/**
 * Generates a PDF document from CV data using Handlebars templates
 * @param data Complete CV data
 * @returns PDF document as Buffer
 */
export async function generatePDF(data: CompleteCV): Promise<Buffer> {
  try {
    // Get template path based on template type
    const templateType = data.preferences.templateType || 'professional';
    // Use path relative to the current working directory instead of __dirname
    const templatePath = path.resolve('./server/templates', `${templateType}.hbs`);
    console.log("Template path:", templatePath);
    
    // Verify that template file exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at path: ${templatePath}`);
    }
    
    // Read the template file
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    
    // Compile the template
    const template = Handlebars.compile(templateSource);
    
    // Prepare data for the template
    const templateData = {
      ...data,
      sectionOrder: data.preferences.sectionOrder?.sectionIds || [
        'experience', 'education', 'certificates', 'competencies', 'extracurricular'
      ]
    };
    
    // Generate HTML
    const html = template(templateData);
    
    // Generate PDF with additional options for Replit environment
    const pdfOptions = {
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 30000 // Longer timeout of 30 seconds
    };
    
    const file = { content: html };
    const buffer = await pdf.generatePdf(file, pdfOptions);
    
    return buffer;
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}
