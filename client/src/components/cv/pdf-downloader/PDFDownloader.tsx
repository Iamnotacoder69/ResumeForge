import React, { useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CompleteCV } from '@shared/types';
import ProfessionalPdfTemplate from '../pdf-templates/ProfessionalPdfTemplate';

interface PDFDownloaderProps {
  data: CompleteCV;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

const PDFDownloader: React.FC<PDFDownloaderProps> = ({ 
  data, 
  onSuccess, 
  onError 
}) => {
  // Prepare the filename
  const firstName = data.personal?.firstName || '';
  const lastName = data.personal?.lastName || '';
  const pdfFileName = `${firstName}_${lastName}_CV`.replace(/\s+/g, '_') + '.pdf';
  
  // Create the document once to avoid re-renders
  const pdfDocument = <ProfessionalPdfTemplate data={data} />;

  useEffect(() => {
    // The component has mounted - trigger the download
    const link = document.querySelector('.auto-pdf-download');
    if (link) {
      setTimeout(() => {
        try {
          // @ts-ignore - this element will have a click method
          link.click();
          setTimeout(onSuccess, 500);
        } catch (error) {
          onError(error instanceof Error ? error : new Error('Unknown error'));
        }
      }, 100);
    }
    
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [onSuccess, onError]);

  return (
    <div style={{ display: 'none' }}>
      <PDFDownloadLink 
        document={pdfDocument}
        fileName={pdfFileName}
        className="auto-pdf-download"
      >
        {({ loading, error }) => {
          if (error) {
            console.error("Error in PDF generation:", error);
            onError(error instanceof Error ? error : new Error('Failed to generate PDF'));
          }
          
          return loading ? "Loading..." : "Download";
        }}
      </PDFDownloadLink>
    </div>
  );
};

export default PDFDownloader;