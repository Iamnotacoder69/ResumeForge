import { Router, Request, Response } from 'express';
import { completeCvSchema } from '../../shared/schema';
import { createHtmlToPdfJob } from '../cloud-convert';
import { renderCVToHTML, storeTempCV, getTempCV, deleteTempCV } from '../render-template';
import { z } from 'zod';

const router = Router();

/**
 * Endpoint to create a temporary CV rendering job
 * POST /api/render-template
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Use a more flexible validation approach for PDF generation
    // This allows extracted CV data to work even if it doesn't perfectly match the schema
    let cvData;
    
    try {
      // First try strict validation
      cvData = completeCvSchema.parse(req.body);
    } catch (validationError) {
      console.log('Strict validation failed, attempting to sanitize data...');
      
      // If strict validation fails, create a sanitized version with defaults
      const inputData = req.body;
      
      // Create a sanitized version with all required fields
      cvData = {
        personal: {
          firstName: inputData.personal?.firstName || '',
          lastName: inputData.personal?.lastName || '',
          professionalTitle: inputData.personal?.professionalTitle || '',
          email: inputData.personal?.email || '',
          phone: inputData.personal?.phone || '',
          linkedin: inputData.personal?.linkedin || '',
          photoUrl: inputData.personal?.photoUrl,
        },
        professional: {
          summary: inputData.professional?.summary || '',
        },
        keyCompetencies: {
          technicalSkills: Array.isArray(inputData.keyCompetencies?.technicalSkills) ? 
            inputData.keyCompetencies.technicalSkills : [],
          softSkills: Array.isArray(inputData.keyCompetencies?.softSkills) ? 
            inputData.keyCompetencies.softSkills : [],
        },
        experience: Array.isArray(inputData.experience) ? inputData.experience.map(exp => ({
          companyName: exp.companyName || '',
          jobTitle: exp.jobTitle || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate,
          isCurrent: exp.isCurrent || false,
          responsibilities: exp.responsibilities || '',
        })) : [],
        education: Array.isArray(inputData.education) ? inputData.education.map(edu => ({
          schoolName: edu.schoolName || '',
          major: edu.major || '',
          startDate: edu.startDate || '',
          endDate: edu.endDate || '',
          achievements: edu.achievements,
        })) : [],
        certificates: Array.isArray(inputData.certificates) ? inputData.certificates : [],
        languages: Array.isArray(inputData.languages) ? inputData.languages : [],
        extracurricular: Array.isArray(inputData.extracurricular) ? inputData.extracurricular : [],
        additional: {
          skills: Array.isArray(inputData.additional?.skills) ? inputData.additional.skills : [],
        },
        templateSettings: {
          template: inputData.templateSettings?.template || 'professional',
          includePhoto: inputData.templateSettings?.includePhoto || false,
          sectionOrder: Array.isArray(inputData.templateSettings?.sectionOrder) ? 
            inputData.templateSettings.sectionOrder : 
            [
              { id: 'personal', name: 'Personal Information', visible: true, order: 0 },
              { id: 'summary', name: 'Professional Summary', visible: true, order: 1 },
              { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 2 },
              { id: 'experience', name: 'Work Experience', visible: true, order: 3 },
              { id: 'education', name: 'Education', visible: true, order: 4 },
              { id: 'certificates', name: 'Certificates', visible: true, order: 5 },
              { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 6 },
              { id: 'additional', name: 'Additional Information', visible: true, order: 7 },
            ],
        },
      };
    }
    
    // Store the CV data temporarily and get an ID
    const tempId = storeTempCV(cvData);
    
    // Create a render URL (this URL will be accessed by CloudConvert)
    // We need to use a publicly accessible URL, not localhost
    const host = req.get('host');
    // Use https:// for CloudConvert to access our HTML
    const renderUrl = `https://${host}/api/render-template/${tempId}`;
    
    console.log('Created render template with URL:', renderUrl);
    
    // Return the temporary ID and render URL
    res.json({
      success: true,
      tempId,
      renderUrl
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid CV data format', details: error.errors });
    }
    
    console.error('Error creating render template:', error);
    res.status(500).json({ error: 'Failed to create template rendering' });
  }
});

/**
 * Endpoint to render a CV as HTML (accessed by CloudConvert)
 * GET /api/render-template/:id
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the temporarily stored CV data
    const cvData = getTempCV(id);
    
    if (!cvData) {
      return res.status(404).json({ error: 'CV data not found or expired' });
    }
    
    // Render the CV as HTML
    const html = renderCVToHTML(cvData);
    
    // Send the HTML response
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error rendering CV template:', error);
    res.status(500).json({ error: 'Failed to render CV template' });
  }
});

/**
 * Endpoint to generate a PDF using CloudConvert
 * POST /api/render-template/:id/pdf
 */
router.post('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the temporarily stored CV data
    const cvData = getTempCV(id);
    
    if (!cvData) {
      return res.status(404).json({ error: 'CV data not found or expired' });
    }
    
    // Create a render URL (this URL will be accessed by CloudConvert)
    const host = req.get('host');
    // Use https:// for CloudConvert to access our HTML
    const renderUrl = `https://${host}/api/render-template/${id}`;
    
    console.log('Generating PDF from render URL:', renderUrl);
    
    // Create a CloudConvert job to convert the HTML to PDF
    const result = await createHtmlToPdfJob(renderUrl);
    
    if (!result.success) {
      return res.status(500).json({ error: 'PDF conversion failed', details: result.error });
    }
    
    // Return the download URL
    res.json({
      success: true,
      downloadUrl: result.downloadUrl,
      fileName: result.fileName || `${cvData.personal?.firstName || 'CV'}_${cvData.personal?.lastName || ''}.pdf`
    });
    
    // Clean up the temporary CV data after successful conversion
    setTimeout(() => {
      deleteTempCV(id);
    }, 5 * 60 * 1000); // Keep the data for 5 more minutes after conversion
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;