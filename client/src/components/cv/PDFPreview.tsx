import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CompleteCV } from '@shared/types';
import { generatePDFFromHTML, PDFGenerationOptions } from '@/lib/pdf-generator';
import CVTemplate from './templates/CVTemplate';
import { Download } from 'lucide-react';

interface PDFPreviewProps {
  data: CompleteCV;
  onClose?: () => void;
  onDownload?: () => void;
}

/**
 * PDF Preview component that allows for downloading the CV as a PDF
 * Uses Playwright server-side printing for high-quality PDF generation
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data, onClose, onDownload }) => {
  const templateRef = useRef<HTMLDivElement>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleDownloadPDF = useCallback(async () => {
    if (!templateRef.current) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Configure PDF generation options
      const options: PDFGenerationOptions = {
        fileName: `${data.personal.firstName}_${data.personal.lastName}_CV.pdf`,
        showProgress: true,
        onProgress: (progress) => {
          setDownloadProgress(progress);
        },
        onComplete: () => {
          setIsDownloading(false);
          setDownloadProgress(100);
          
          toast({
            title: "PDF Downloaded",
            description: "Your CV has been successfully downloaded as a PDF.",
            variant: "default",
          });
          
          // Call the parent's onDownload callback if provided
          if (onDownload) {
            onDownload();
          }
        },
        onError: (error) => {
          setIsDownloading(false);
          console.error('Error generating PDF:', error);
          
          toast({
            title: "PDF Generation Failed",
            description: "There was an error generating your PDF. Please try again.",
            variant: "destructive",
          });
        }
      };
      
      // Generate the PDF using the HTML content and Playwright
      await generatePDFFromHTML(templateRef.current, data, options);
    } catch (error) {
      setIsDownloading(false);
      console.error('Error generating PDF:', error);
      
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  }, [data, toast, onDownload]);
  
  return (
    <div className="pdf-preview-container space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button 
              variant="outline" 
              onClick={onClose}
              className="text-sm"
            >
              Back to Editor
            </Button>
          )}
          <h2 className="text-xl font-semibold text-gray-800">CV Preview</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {isDownloading && (
            <div className="w-32 sm:w-40">
              <Progress value={downloadProgress} className="h-2" />
            </div>
          )}
          
          <Button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download as PDF
              </>
            )}
          </Button>
        </div>
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