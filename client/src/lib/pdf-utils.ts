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
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Determine appropriate SVG colors based on the template
    // Look for template class markers to identify the template
    const templateElement = clonedElement.querySelector('.cv-template');
    const isModernTemplate = templateElement?.parentElement?.querySelector('.bg-blue-600') !== null;
    const isMinimalTemplate = templateElement?.parentElement?.querySelector('.uppercase.tracking-wider') !== null;
    
    // Set icon colors based on template
    let iconColor = '#333'; // Default color for professional template
    let iconFill = 'none';
    
    if (isModernTemplate) {
      iconColor = '#3b82f6'; // Blue for Modern template
    } else if (isMinimalTemplate) {
      iconColor = '#111'; // Dark for Minimal template
    }
    
    // Fix SVG icons - replace them with inline SVG content
    // Email icon
    const emailIcons = clonedElement.querySelectorAll('svg[viewBox="0 0 24 24"] path[d*="M3 8l7.89 5.26"]');
    emailIcons.forEach(icon => {
      const svg = icon.closest('svg');
      if (svg) {
        const parent = svg.parentElement;
        if (parent) {
          // Create an inline SVG for email
          const emailSvgHtml = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${iconFill}" stroke="${iconColor}" stroke-width="2" style="margin-right: 4px;">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          `;
          parent.innerHTML = emailSvgHtml + parent.innerHTML.substring(parent.innerHTML.indexOf('</svg>') + 6);
        }
      }
    });
    
    // Phone icon
    const phoneIcons = clonedElement.querySelectorAll('svg[viewBox="0 0 24 24"] path[d*="M3 5a2 2 0 012-2h3.28"]');
    phoneIcons.forEach(icon => {
      const svg = icon.closest('svg');
      if (svg) {
        const parent = svg.parentElement;
        if (parent) {
          // Create an inline SVG for phone
          const phoneSvgHtml = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${iconFill}" stroke="${iconColor}" stroke-width="2" style="margin-right: 4px;">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
          `;
          parent.innerHTML = phoneSvgHtml + parent.innerHTML.substring(parent.innerHTML.indexOf('</svg>') + 6);
        }
      }
    });
    
    // LinkedIn icon
    const linkedinIcons = clonedElement.querySelectorAll('svg[viewBox="0 0 24 24"] path[d*="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037"]');
    linkedinIcons.forEach(icon => {
      const svg = icon.closest('svg');
      if (svg) {
        const parent = svg.parentElement;
        if (parent) {
          // For LinkedIn icon, we'll use filled style for all templates
          const linkedinSvgHtml = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="${iconColor}" style="margin-right: 4px;">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
            </svg>
          `;
          parent.innerHTML = linkedinSvgHtml + parent.innerHTML.substring(parent.innerHTML.indexOf('</svg>') + 6);
        }
      }
    });
    
    // Get the HTML content with fixed SVGs
    const html = clonedElement.outerHTML;
    
    // Basic CSS for the CV along with the additional CSS
    let css = `
      @page {
        size: A4 portrait;
        margin: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
      }
      
      * {
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
        print-color-adjust: exact;
        box-sizing: border-box;
      }
    `;
    
    // Add additional CSS if provided
    if (options.additionalCSS) {
      css += options.additionalCSS;
    }
    
    // Generate the PDF with a complete HTML document
    await generatePDF(
      `<!DOCTYPE html>
       <html>
         <head>
           <meta charset="UTF-8">
           <title>CV</title>
           <style>${css}</style>
         </head>
         <body>
           ${html}
         </body>
       </html>`,
      undefined,
      options.fileName
    );
  } catch (error) {
    console.error('Error capturing element as PDF:', error);
    throw error;
  }
}