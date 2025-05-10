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
    <div className="pdf-preview-container min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Preview Your CV</h2>
            <p className="text-gray-500 text-sm max-w-xl">
              Here's how your CV will look when downloaded. Use the button below to save it as a PDF or make additional edits.
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
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
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors"
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
        
        <div className="bg-gray-800/5 p-4 rounded-lg mb-6 border border-gray-200 print:hidden">
          <div className="flex items-center text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-amber-500">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M12 8v4l3 3"></path>
            </svg>
            <span>The preview shows exactly how your CV will appear when downloaded as a PDF file.</span>
          </div>
        </div>
        
        <div className="pdf-preview-content flex justify-center">
          <div className="max-w-[210mm] w-full bg-white shadow-xl rounded-sm print:shadow-none print:mx-0 print:max-w-full cv-template-wrapper">
            <CVTemplate data={data} templateRef={printRef} />
          </div>
        </div>
        
        <div className="mt-8 text-center print:hidden">
          <p className="text-sm text-gray-500 mb-4">Need to make changes? Go back to the editor or download your CV now.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Continue Editing
            </Button>
            
            <Button 
              onClick={handlePrintPDF}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download CV as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;