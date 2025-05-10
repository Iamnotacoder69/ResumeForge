import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import CVTemplate from './templates/CVTemplate';

interface PDFPreviewProps {
  data: CompleteCV;
  onClose?: () => void;
}

/**
 * PDF Preview component that allows for printing/downloading the CV as a PDF
 * using the browser's built-in print functionality
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrintPDF = useCallback(() => {
    // Define a filename for the PDF
    const firstName = data.personal?.firstName || '';
    const lastName = data.personal?.lastName || '';
    const pdfFileName = `${firstName}_${lastName}_CV`.replace(/\s+/g, '_');
    
    // Create a print-friendly stylesheet
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        /* Hide everything except the CV template */
        body * {
          visibility: hidden;
        }
        .cv-template-wrapper, .cv-template-wrapper * {
          visibility: visible;
        }
        .cv-template-wrapper {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          box-shadow: none !important;
          background-color: white !important;
        }
        
        /* Force background colors and images to print */
        .cv-template-wrapper * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Page settings for PDF output */
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        
        /* Ensure proper font rendering */
        * {
          font-family: 'Inter', 'Helvetica', sans-serif !important;
          -webkit-font-smoothing: antialiased;
        }
        
        /* Fix any text overflow issues */
        p, h1, h2, h3 {
          overflow: visible !important;
          white-space: normal !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Set the document title to improve the suggested filename
    const originalTitle = document.title;
    document.title = pdfFileName;
    
    // Trigger the print dialog
    window.print();
    
    // Restore the original title and remove the print-specific styles
    setTimeout(() => {
      document.title = originalTitle;
      document.head.removeChild(style);
    }, 1000);
  }, [data.personal]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview header */}
      <header className="qwalify-header sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold flex items-center">
                <span className="qwalify-logo">Qwalify</span>
                <span className="text-white">CV Preview</span>
              </h1>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={onClose}
                variant="outline"
                className="text-xs sm:text-sm qwalify-secondary-btn flex items-center gap-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
                Back to Editor
              </Button>
              
              <Button 
                onClick={handlePrintPDF}
                className="text-xs sm:text-sm qwalify-primary-btn flex items-center gap-2"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download as PDF
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 sm:px-6 py-8 print:p-0">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:mx-0 print:max-w-full">
          <CVTemplate data={data} templateRef={printRef} />
        </div>
        
        <div className="mt-6 text-center text-gray-500 text-sm print:hidden">
          <p>Click "Download as PDF" to save your CV. You can go back to make further edits if needed.</p>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="qwalify-footer py-4 mt-10 print:hidden">
        <div className="container mx-auto px-4">
          <p className="text-sm text-white/70">
            © 2025 Qwalify. Create professional CVs that get noticed.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PDFPreview;