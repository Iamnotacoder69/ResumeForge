import React, { useCallback, useRef, useState } from 'react';
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
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleDownloadPDF = useCallback(async () => {
    if (!templateRef.current || isGenerating) return;
    
    try {
      setIsGenerating(true);
      
      // Generate the PDF directly from HTML using html2pdf.js
      await generatePDFFromHTML(templateRef.current, data);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [data, isGenerating]);
  
  return (
    <div className="pdf-preview-container space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Preview</h2>
        <Button 
          onClick={handleDownloadPDF}
          className="flex items-center gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
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
            </>
          )}
        </Button>
      </div>
      
      <div className="pdf-preview-content overflow-auto pb-10">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none">
          <CVTemplate data={data} templateRef={templateRef} />
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center mt-2">
        <p>
          This preview is exactly how your PDF will look when downloaded.
          <br />
          Clicking "Download as PDF" will convert this preview to a PDF file.
        </p>
      </div>
    </div>
  );
};

export default PDFPreview;