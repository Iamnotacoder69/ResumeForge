import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import { generatePDFFromHTML } from '@/lib/pdf-generator';
import CVTemplate from './templates/CVTemplate';

interface PDFPreviewProps {
  data: CompleteCV;
}

/**
 * PDF Preview component that allows for downloading the CV as a PDF
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data }) => {
  const templateRef = useRef<HTMLDivElement>(null);
  
  const handleDownloadPDF = useCallback(async () => {
    if (!templateRef.current) return;
    
    try {
      // Generate the PDF using the HTML content
      await generatePDFFromHTML(templateRef.current, data);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }, [data]);
  
  return (
    <div className="pdf-preview-container space-y-6">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          size="lg"
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
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
          <CVTemplate data={data} templateRef={templateRef} />
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;