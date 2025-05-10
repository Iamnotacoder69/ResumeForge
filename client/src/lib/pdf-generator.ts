import { CompleteCV } from '@shared/types';

/**
 * Prints and downloads a PDF using the browser's built-in print functionality
 * @param element The HTML element to print
 * @param data The CV data (for filename)
 * @returns Promise that resolves when PDF generation is complete
 */
export async function generatePDFFromHTML(
  element: HTMLElement,
  data: CompleteCV
): Promise<void> {
  try {
    // Show loading indicator
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

    // Store current page state
    const originalTitle = document.title;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    
    // Prepare document for printing
    const firstName = data.personal.firstName || 'CV';
    const lastName = data.personal.lastName || '';
    document.title = `${firstName}_${lastName}_CV`;
    
    // Create an iframe to contain the printable content
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.width = '210mm'; // A4 width
    printFrame.style.height = '297mm'; // A4 height
    printFrame.style.border = 'none';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    document.body.appendChild(printFrame);
    
    // Write the content into the iframe and apply print-specific styling
    const printDocument = printFrame.contentDocument;
    if (!printDocument) {
      throw new Error('Could not access print frame document');
    }
    
    // Clone the element to avoid modifying the original
    const clonedContent = element.cloneNode(true) as HTMLElement;
    
    // Write necessary HTML structure
    printDocument.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.title}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @media print {
              body {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .cv-template-wrapper {
                width: 210mm;
                min-height: 297mm;
                padding: 0;
                margin: 0;
                box-shadow: none;
                page-break-inside: avoid;
              }
              /* Copy existing styles to ensure content looks right */
              ${Array.from(document.styleSheets)
                .filter(styleSheet => {
                  try {
                    // Only include same-origin stylesheets
                    return !!styleSheet.href && 
                      styleSheet.href.startsWith(window.location.origin);
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
            }
          </style>
        </head>
        <body>
        </body>
      </html>
    `);
    
    // Append the cloned content
    printDocument.body.appendChild(clonedContent);
    
    // Remove loading indicator
    document.body.removeChild(loadingEl);
    
    // Wait for styles to apply
    setTimeout(() => {
      // Open print dialog
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      
      // Clean up after printing
      setTimeout(() => {
        // Restore original document state
        document.title = originalTitle;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        
        // Remove the iframe when done
        if (printFrame.parentNode) {
          printFrame.parentNode.removeChild(printFrame);
        }
      }, 500);
    }, 500);
    
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