import { CompleteCV } from '@shared/types';

/**
 * Generates a PDF from an HTML element using print functionality
 * This provides a clean, direct, and immediate PDF download
 * 
 * @param element The HTML element to print
 * @param data The CV data (for filename)
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Show a loading indicator
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

      // Create a standalone document to print
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      
      // Append the frame to body
      document.body.appendChild(printFrame);
      
      // Get the frame's document and write our custom print content to it
      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      
      if (!frameDoc) {
        throw new Error('Could not access print frame document');
      }
      
      // Start building the print document with custom styles
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${data.personal.firstName} ${data.personal.lastName} - CV</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            html, body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
            }
            * {
              box-sizing: border-box;
            }
            /* Ensure page breaks don't happen in the middle of sections */
            section {
              page-break-inside: avoid;
            }
            /* Hide non-printable elements */
            .no-print {
              display: none !important;
            }
            /* Handle page breaks between sections more elegantly */
            h2, h3 {
              page-break-after: avoid;
            }
            li, tr {
              page-break-inside: avoid;
            }
            /* Extract styles from the original element to ensure consistency */
            ${Array.from(document.styleSheets)
              .filter(styleSheet => {
                try {
                  // Filter out external stylesheets
                  return !styleSheet.href || styleSheet.href.startsWith(window.location.origin);
                } catch (e) {
                  return false;
                }
              })
              .map(styleSheet => {
                try {
                  return Array.from(styleSheet.cssRules)
                    .map(rule => rule.cssText)
                    .join('\\n');
                } catch (e) {
                  return '';
                }
              })
              .join('\\n')
            }
          </style>
        </head>
        <body>
      `);
      
      // Add the HTML content
      frameDoc.write(element.outerHTML);
      
      // Finish the document
      frameDoc.write('</body></html>');
      frameDoc.close();
      
      // Wait for all content to load (images, fonts, etc.)
      const onLoadHandler = () => {
        // Remove the loading indicator
        document.body.removeChild(loadingEl);
        
        // Print the document as PDF
        printFrame.contentWindow?.print();
        
        // Cleanup after a slight delay to allow the print dialog to be processed
        setTimeout(() => {
          document.body.removeChild(printFrame);
          resolve();
        }, 1000);
      };
      
      if (printFrame.contentWindow?.document.readyState === 'complete') {
        onLoadHandler();
      } else {
        printFrame.onload = onLoadHandler;
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
      reject(error);
    }
  });
}