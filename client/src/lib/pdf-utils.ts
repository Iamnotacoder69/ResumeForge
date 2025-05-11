import { apiRequest } from '@/lib/queryClient';

/**
 * Generate a PDF from HTML content using WeasyPrint
 * @param html HTML content to convert to PDF
 * @param css Optional CSS content for styling
 * @param fileName Optional filename for the downloaded PDF
 * @returns Promise that resolves when the PDF generation is complete
 */
export async function generatePDF(html: string, css?: string, fileName?: string): Promise<void> {
  if (!html) {
    throw new Error('HTML content is required');
  }

  try {
    // Create a form with the HTML and CSS content
    const formData = {
      html,
      css,
      fileName: fileName || `CV_${new Date().toISOString().split('T')[0]}`
    };

    // Create a request to the PDF generation endpoint 
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    // Check if we received a PDF file
    const contentType = response.headers.get('content-type');
    
    if (contentType === 'application/pdf') {
      // We got a PDF file, download it 
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a link to download the PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `CV_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Handle base64 response (fallback)
      const result = await response.json();
      
      if (result.success && result.data?.base64) {
        const byteCharacters = atob(result.data.base64);
        const byteArrays = [];
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }
        
        const blob = new Blob([new Uint8Array(byteArrays)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `CV_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Capture HTML content and convert to PDF
 * @param elementRef React ref to the element to capture
 * @param options Options for PDF generation
 * @returns Promise that resolves when the PDF generation is complete
 */
export async function captureElementAsPDF(
  element: HTMLElement, 
  options: { 
    fileName?: string, 
    additionalCSS?: string 
  } = {}
): Promise<void> {
  if (!element) {
    throw new Error('Element is required');
  }

  try {
    // Get the HTML content and computed styles
    const html = element.outerHTML;
    
    // Create a style element with all the styles from the document
    let css = '';
    
    // Get all the stylesheet rules
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const styleSheet = document.styleSheets[i];
        if (styleSheet.cssRules) {
          for (let j = 0; j < styleSheet.cssRules.length; j++) {
            css += styleSheet.cssRules[j].cssText + '\n';
          }
        }
      } catch (e) {
        console.warn('Error accessing stylesheet:', e);
      }
    }
    
    // Add additional CSS if provided
    if (options.additionalCSS) {
      css += options.additionalCSS;
    }
    
    // Add print-specific CSS
    css += `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
      }
      * {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
        print-color-adjust: exact;
      }
    `;
    
    // Generate the PDF
    await generatePDF(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CV</title><style>${css}</style></head><body>${html}</body></html>`,
      undefined,
      options.fileName
    );
  } catch (error) {
    console.error('Error capturing element as PDF:', error);
    throw error;
  }
}