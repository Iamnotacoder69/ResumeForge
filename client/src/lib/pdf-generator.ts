import { CompleteCV } from '@shared/types';

/**
 * Custom print-to-PDF functionality that triggers the browser's print dialog
 * with optimized settings for PDF download
 * 
 * @param element The HTML element to print
 * @param data The CV data (for filename suggestion)
 * @returns Promise that resolves when print dialog is opened
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV
): Promise<void> {
  try {
    // Show a loading indicator or message
    const loadingEl = document.createElement('div');
    loadingEl.className = 
      'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingEl.innerHTML = `
      <div class="bg-white p-4 rounded-md shadow-xl">
        <div class="flex items-center space-x-3">
          <div class="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full"></div>
          <p class="text-lg font-medium">Preparing PDF...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loadingEl);

    try {
      // Create a clone of the element to print
      const printContent = element.cloneNode(true) as HTMLElement;
      
      // Apply print-specific styles to the clone
      printContent.classList.add('print-content');
      printContent.style.width = '100%';
      printContent.style.maxWidth = '21cm'; // A4 width
      printContent.style.margin = '0 auto';
      printContent.style.backgroundColor = 'white';
      
      // Create a new print window/iframe
      const printFrame = document.createElement('iframe');
      
      // Hide the iframe (it's just used for printing)
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      
      // Append the iframe to the document
      document.body.appendChild(printFrame);
      
      // Get the iframe document and write the print content
      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      
      if (!frameDoc) {
        throw new Error('Failed to access print frame document');
      }
      
      // Generate a filename from user data
      const firstName = data.personal.firstName || 'CV';
      const lastName = data.personal.lastName || '';
      const filename = `${firstName}_${lastName}_CV.pdf`.replace(/\s+/g, '_');
      
      // Write the print document with proper styling
      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <style>
              @page {
                size: A4;
                margin: 0.5cm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, Helvetica, sans-serif;
                color: #333;
                background: white;
              }
              .print-wrapper {
                width: 100%;
                max-width: 100%;
                margin: 0 auto;
                padding: 0.5cm;
                box-sizing: border-box;
              }
              /* Copy embedded fonts and styles from the main page */
              ${Array.from(document.styleSheets)
                .filter(sheet => !sheet.href || sheet.href.startsWith(window.location.origin))
                .map(sheet => {
                  try {
                    return Array.from(sheet.cssRules)
                      .map(rule => rule.cssText)
                      .join('\n');
                  } catch (e) {
                    console.warn('Could not access cssRules for stylesheet', e);
                    return '';
                  }
                })
                .join('\n')}
            </style>
          </head>
          <body>
            <div class="print-wrapper">
              ${printContent.outerHTML}
            </div>
          </body>
        </html>`);
      frameDoc.close();
      
      // Remove loading indicator once the document is ready
      document.body.removeChild(loadingEl);
      
      // Add event listener for after print to clean up
      const handlePrintComplete = () => {
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
        window.removeEventListener('focus', handlePrintComplete);
      };
      
      window.addEventListener('focus', handlePrintComplete);
      
      // Use setTimeout to ensure the document is fully loaded before printing
      setTimeout(() => {
        // Print the document (this opens the print dialog)
        if (printFrame.contentWindow) {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        }
      }, 500);
      
    } catch (error) {
      console.error('Error in print preparation:', error);
      throw error;
    }
  } catch (error) {
    // Remove loading indicator in case of error
    const loadingEl = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
    
    // Handle error
    console.error('Error generating PDF:', error);
    
    // Show error message
    const errorMessage = 
      error instanceof Error ? error.message : 'Unknown error generating PDF';
    
    alert(`Failed to generate PDF: ${errorMessage}`);
  }
}