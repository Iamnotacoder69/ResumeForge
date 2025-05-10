import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Handlebars from 'handlebars';
import { registerHelpers } from './handlebars-helpers';
import { CompleteCV, TemplateType } from '@shared/types';

// Register all Handlebars helpers
registerHelpers();

// Template cache
let templateCache: Record<string, HandlebarsTemplateDelegate<any>> = {};

/**
 * Load and compile a template from a given path
 */
async function loadTemplate(templateType: TemplateType): Promise<HandlebarsTemplateDelegate<any>> {
  if (templateCache[templateType]) {
    return templateCache[templateType];
  }
  
  try {
    // Dynamically fetch the template from public directory
    const response = await fetch(`/templates/${templateType}.hbs`);
    if (!response.ok) {
      throw new Error(`Failed to load template: ${response.statusText}`);
    }
    
    const templateContent = await response.text();
    const compiledTemplate = Handlebars.compile(templateContent);
    
    // Cache the compiled template
    templateCache[templateType] = compiledTemplate;
    
    return compiledTemplate;
  } catch (error) {
    console.error(`Error loading template ${templateType}:`, error);
    throw error;
  }
}

/**
 * Generate PDF from CV data
 * @param cvData The complete CV data
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDF(cvData: CompleteCV): Promise<Blob> {
  try {
    // Determine which template to use
    const templateType = cvData.templateSettings?.template || 'professional' as TemplateType;
    console.log('Generating PDF with template:', templateType);
    
    // Load and compile the template
    const template = await loadTemplate(templateType);
    
    // Generate HTML content
    console.log('Applying data to template', {
      personal: cvData.personal,
      hasSections: cvData.templateSettings?.sectionOrder?.length,
      hasSummary: !!cvData.professional?.summary,
      hasExperience: cvData.experience?.length
    });
    const htmlContent = template(cvData);
    
    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    document.body.appendChild(container);
    
    // A small delay to ensure fonts are loaded
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create canvas from HTML content
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Enable CORS for images
      allowTaint: true,
      logging: false
    });
    
    // Create PDF with A4 dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add image to PDF
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95), // Using JPEG for better compression
      'JPEG',
      0,
      0,
      imgWidth,
      imgHeight
    );
    
    // If content spans multiple pages, add more pages
    if (imgHeight > pageHeight) {
      let remainingHeight = imgHeight;
      let position = -pageHeight; // Start position for the next page
      
      while (remainingHeight > pageHeight) {
        // Add a new page
        pdf.addPage();
        
        // Add the next portion of the image
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 0.95),
          'JPEG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        
        // Update remaining height and position
        remainingHeight -= pageHeight;
        position -= pageHeight;
      }
    }
    
    // Clean up
    document.body.removeChild(container);
    
    // Create a blob from the PDF
    const pdfBlob = pdf.output('blob');
    
    return pdfBlob;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate and download PDF from CV data
 * @param cvData The complete CV data
 */
export async function downloadPDF(cvData: CompleteCV): Promise<void> {
  try {
    console.log('Starting PDF generation process');
    const pdfBlob = await generatePDF(cvData);
    console.log('PDF generation successful, creating blob URL');
    
    // Generate PDF file name
    const fileName = `${cvData.personal?.firstName || 'cv'}_${
      cvData.personal?.lastName || ''
    }_CV.pdf`.replace(/\s+/g, '_');
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = fileName;
    console.log('Download link created, initiating download');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up - Use setTimeout to ensure the browser has time to process the download
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      console.log('Download cleanup complete');
    }, 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}