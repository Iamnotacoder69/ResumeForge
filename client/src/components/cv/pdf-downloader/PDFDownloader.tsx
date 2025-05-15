import React, { useEffect } from 'react';
import { PDFDownloadLink, Document } from '@react-pdf/renderer';
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
  
  // Select the appropriate template based on the setting
  const getTemplate = () => {
    const templateType = data.templateSettings?.template || 'professional';
    
    // In the future, we can add more template types here
    return <ProfessionalPdfTemplate data={data} />;
  };

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
  }, [onSuccess, onError]);

  return (
    <PDFDownloadLink 
      document={getTemplate()}
      fileName={pdfFileName}
      className="auto-pdf-download"
      style={{ display: 'none' }}
    >
      {({ loading, error }) => {
        if (error) {
          console.error("Error in PDF generation:", error);
          onError(error instanceof Error ? error : new Error('Failed to generate PDF'));
        }
        
        return <span>{loading ? 'Loading document...' : 'Download'}</span>;
      }}
    </PDFDownloadLink>
  );
};

export default PDFDownloader;