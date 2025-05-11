/**
 * Utility functions for PDF generation using CloudConvert API
 */

/**
 * Generates a PDF from a CV template HTML using the CloudConvert API endpoint
 * @param templateRef Reference to the CV template DOM element
 * @param firstName User's first name for the filename
 * @param lastName User's last name for the filename
 */
export async function generatePDFWithCloudConvert(
  templateRef: React.RefObject<HTMLDivElement>,
  firstName: string = '',
  lastName: string = ''
): Promise<void> {
  try {
    if (!templateRef.current) {
      throw new Error('Template reference is not available');
    }
    
    // Create a filename based on user data
    const pdfFileName = `${firstName}_${lastName}_CV`.replace(/\s+/g, '_');
    
    // Get the HTML content of the template
    const htmlContent = templateRef.current.outerHTML;
    
    // Add necessary styling for the PDF
    const completeHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pdfFileName}</title>
        <style>
          * {
            font-family: 'Inter', 'Helvetica', sans-serif;
            -webkit-font-smoothing: antialiased;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          body {
            margin: 0;
            padding: 0;
          }
          ${getComputedStyles()}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Show loading notification
    // Note: You might want to use a proper loading UI component here
    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = 'Generating PDF, please wait...';
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
    loadingMessage.style.color = 'white';
    loadingMessage.style.padding = '20px';
    loadingMessage.style.borderRadius = '5px';
    loadingMessage.style.zIndex = '9999';
    document.body.appendChild(loadingMessage);
    
    // Make the API request to convert HTML to PDF
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: completeHTML,
        options: {
          filename: `${pdfFileName}.pdf`,
          pageSize: 'A4',
          margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm'
          }
        }
      }),
    });
    
    // Remove the loading message
    document.body.removeChild(loadingMessage);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate PDF');
    }
    
    // Get the PDF blob
    const pdfBlob = await response.blob();
    
    // Create a URL for the blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Create a link and click it to download the PDF
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${pdfFileName}.pdf`;
    link.click();
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extracts computed styles from the document to include in the PDF
 */
function getComputedStyles(): string {
  let styles = '';
  
  // Extract styles from all style sheets
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      const rules = sheet.cssRules || sheet.rules;
      
      for (let j = 0; j < rules.length; j++) {
        styles += rules[j].cssText;
      }
    } catch (e) {
      console.warn('Could not access stylesheet', e);
    }
  }
  
  return styles;
}