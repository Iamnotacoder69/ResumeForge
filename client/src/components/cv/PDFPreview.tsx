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
        .cv-page, .cv-page *, .cv-template-wrapper, .cv-template-wrapper * {
          visibility: visible;
        }
        
        /* Position for printing */
        .cv-page {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          box-shadow: none !important;
          background-color: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        
        /* Force background colors and images to print */
        .cv-page *, .cv-template-wrapper * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Page settings for PDF output */
        @page {
          size: A4 portrait;
          margin: 0;
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
        
        /* Maintain page breaks */
        .cv-section {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        .cv-page-break {
          page-break-before: always;
          break-before: page;
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
    <div className="pdf-preview-container space-y-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button 
          onClick={onClose}
          variant="outline"
          className="flex items-center gap-2"
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
          className="flex items-center gap-2"
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
      
      <div className="pdf-preview-content">
        <div className="paged-container max-w-[210mm] mx-auto">
          <div className="cv-page bg-white shadow-lg print:shadow-none print:mx-0 print:max-w-full" ref={printRef}>
            <CVTemplate data={data} templateRef={printRef} />
          </div>
        </div>
      </div>
      

    </div>
  );
};

export default PDFPreview;