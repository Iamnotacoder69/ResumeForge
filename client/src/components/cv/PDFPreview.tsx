import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import CVTemplate from './templates/CVTemplate';
import { Loader2 } from 'lucide-react';

interface PDFPreviewProps {
  data: CompleteCV;
  onClose?: () => void;
}

/**
 * PDF Preview component that allows for downloading the CV as a PDF
 * using the wkhtmltopdf server-side PDF generation
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGeneratePDF = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Define a filename for the PDF based on the user's name
      const firstName = data.personal?.firstName || '';
      const lastName = data.personal?.lastName || '';
      const pdfFileName = `${firstName}_${lastName}_CV`.replace(/\s+/g, '_');
      
      // Send the CV data to the server for PDF generation
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get the PDF file as a blob
      const blob = await response.blob();
      
      // Create a download link for the PDF
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFileName;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [data]);
  
  return (
    <div className="pdf-preview-container space-y-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button 
          onClick={onClose}
          variant="outline"
          className="flex items-center gap-2 border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#03d27c" 
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
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-[#03d27c] hover:bg-[#03d27c]/90 text-white font-medium"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
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
      
      <div className="pdf-preview-content">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:mx-0 print:max-w-full">
          <CVTemplate data={data} templateRef={printRef} />
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;