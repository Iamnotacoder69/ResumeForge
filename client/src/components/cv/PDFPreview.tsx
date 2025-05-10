import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import CVTemplate from './templates/CVTemplate';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFPreviewProps {
  data: CompleteCV;
  onClose?: () => void;
}

/**
 * PDF Preview component that allows for printing/downloading the CV as a PDF
 * using either the browser's built-in print functionality or server-side xhtml2pdf
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Legacy browser-based printing function
  const handleBrowserPrint = useCallback(() => {
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
  
  // Server-side PDF generation using xhtml2pdf
  const handleGeneratePDF = useCallback(async () => {
    try {
      setIsGenerating(true);
      
      // Call the server-side endpoint
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
      
      // Get the PDF URL
      setPdfUrl(result.pdfUrl);
      
      // Show success toast
      toast({
        title: "PDF Generated Successfully",
        description: "Your CV is ready to download",
        variant: "default",
      });
      
      // Open the PDF in a new tab
      window.open(result.pdfUrl, '_blank');
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [data, toast]);
  
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
        
        <div className="flex gap-3">
          {/* Browser printing button (fallback) */}
          <Button 
            onClick={handleBrowserPrint}
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
              <path d="M6 9V2h12v7"></path>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <path d="M6 14h12v8H6z"></path>
            </svg>
            Print in Browser
          </Button>
          
          {/* Server-side PDF generation button */}
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
      </div>
      
      {pdfUrl && (
        <div className="bg-green-100 p-3 rounded-md border border-green-300 mb-4">
          <p className="text-green-800 text-sm font-medium flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            PDF generated successfully!{' '}
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline text-green-700 hover:text-green-900"
            >
              Click here if download didn't start
            </a>
          </p>
        </div>
      )}
      
      <div className="pdf-preview-content">
        <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none print:mx-0 print:max-w-full">
          <CVTemplate data={data} templateRef={printRef} />
        </div>
      </div>
    </div>
  );
};

export default PDFPreview;