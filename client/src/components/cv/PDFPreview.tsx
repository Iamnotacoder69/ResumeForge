import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import CVTemplate from './templates/CVTemplate';

interface PDFPreviewProps {
  data: CompleteCV;
}

/**
 * PDF Preview component that allows for downloading the CV as a PDF
 * using the browser's native print functionality
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data }) => {
  const templateRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPDF = useCallback(() => {
    // Add print-specific CSS to ensure proper page formatting
    const style = document.createElement('style');
    style.textContent = `
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
          width: 210mm;
          height: auto;
          margin: 0;
          padding: 0;
          box-shadow: none !important;
          background-color: white !important;
          color: black !important;
        }

        /* Perfect page settings for PDF */
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        
        /* Ensure all text is properly rendered */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Remove any page breaks within elements */
        p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol, dl, table, pre {
          page-break-inside: avoid;
        }
        
        /* Ensure section headings are not isolated */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }

        /* Make links and text display properly in print */
        a {
          text-decoration: none !important;
          color: inherit !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger print dialog
    window.print();
    
    // Remove the style after printing
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  }, []);
  
  return (
    <div className="pdf-preview-container space-y-6">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleDownloadPDF}
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
      
      <div className="pdf-preview-content overflow-hidden">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg border rounded-sm">
          {/* A4 paper size aspect ratio with proper dimensions */}
          <div className="w-full" style={{ aspectRatio: '1/1.414' }}>
            <CVTemplate data={data} templateRef={templateRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;