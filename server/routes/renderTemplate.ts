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
    // Validate the CV data
    const cvData = completeCvSchema.parse(req.body);
    
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