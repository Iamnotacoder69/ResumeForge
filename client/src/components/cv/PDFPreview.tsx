import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import { generatePDFFromHTML } from '@/lib/pdf-generator';
import CVTemplate from './templates/CVTemplate';
import { useToast } from '@/hooks/use-toast';

interface PDFPreviewProps {
  data: CompleteCV;
}

/**
 * PDF Preview component that allows for downloading the CV as a PDF
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data }) => {
  const templateRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const handleDownloadPDF = useCallback(async () => {
    if (!templateRef.current) {
      toast({
        title: "Error",
        description: "PDF template reference not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Generate the PDF directly from the data
      // The templateRef is used for style reference only
      await generatePDFFromHTML(templateRef.current, data);
      
      toast({
        title: "Success",
        description: "Your CV has been downloaded as a PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    }
  }, [data, toast]);
  
  return (
    <div className="pdf-preview-container space-y-6">
      <div className="flex justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          <p>This is a preview of your CV. The downloaded PDF may look slightly different.</p>
        </div>
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
      
      <div className="pdf-preview-content">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
          <CVTemplate data={data} templateRef={templateRef} />
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;