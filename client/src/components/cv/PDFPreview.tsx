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
  
  const handleDownloadDocx = useCallback(() => {
    try {
      // Define a filename for the DOCX
      const firstName = data.personal?.firstName || '';
      const lastName = data.personal?.lastName || '';
      const docxFileName = `${firstName}_${lastName}_CV.docx`.replace(/\s+/g, '_');
      
      if (!printRef.current) {
        console.error('CV Template reference is not available');
        return;
      }
      
      // Get the HTML content of the CV template
      const templateHtml = printRef.current.innerHTML;
      
      // For server-side DOCX creation, we'll use an API endpoint
      // Instead, let's create a simplified version by using plain text
      
      // Create a text version of the CV by extracting text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = templateHtml;
      
      // Process CV data into plain text
      let plainText = '';
      
      // Add Name and Title
      plainText += `${data.personal?.firstName || ''} ${data.personal?.lastName || ''}\n`;
      plainText += `${data.personal?.professionalTitle || ''}\n\n`;
      
      // Add Contact Info
      plainText += `Email: ${data.personal?.email || ''}\n`;
      plainText += `Phone: ${data.personal?.phone || ''}\n`;
      if (data.personal?.linkedin) {
        plainText += `LinkedIn: linkedin.com/in/${data.personal.linkedin}\n`;
      }
      plainText += '\n';
      
      // Add Summary
      if (data.professional?.summary) {
        plainText += `PROFESSIONAL SUMMARY\n`;
        plainText += `${data.professional.summary}\n\n`;
      }
      
      // Add Key Competencies
      if (data.professional?.keyCompetencies?.technicalSkills?.length || 
          data.professional?.keyCompetencies?.softSkills?.length) {
        plainText += `KEY COMPETENCIES\n`;
        
        if (data.professional?.keyCompetencies?.technicalSkills?.length) {
          plainText += `Technical Skills:\n`;
          data.professional.keyCompetencies.technicalSkills.forEach(skill => {
            plainText += `- ${skill}\n`;
          });
          plainText += '\n';
        }
        
        if (data.professional?.keyCompetencies?.softSkills?.length) {
          plainText += `Soft Skills:\n`;
          data.professional.keyCompetencies.softSkills.forEach(skill => {
            plainText += `- ${skill}\n`;
          });
          plainText += '\n';
        }
      }
      
      // Add Experience
      if (data.experience?.length) {
        plainText += `EXPERIENCE\n`;
        data.experience.forEach(exp => {
          plainText += `${exp.jobTitle} at ${exp.companyName}\n`;
          plainText += `${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}\n`;
          plainText += `${exp.responsibilities}\n\n`;
        });
      }
      
      // Add Education
      if (data.education?.length) {
        plainText += `EDUCATION\n`;
        data.education.forEach(edu => {
          plainText += `${edu.major} at ${edu.schoolName}\n`;
          plainText += `${edu.startDate} - ${edu.endDate || ''}\n`;
          if (edu.achievements) {
            plainText += `${edu.achievements}\n`;
          }
          plainText += '\n';
        });
      }
      
      // Create a Blob with the text content
      const blob = new Blob([plainText], { type: 'text/plain' });
      
      // Create a download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = docxFileName.replace('.docx', '.txt');
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      console.log('Text file download initiated as an alternative to DOCX');
    } catch (error) {
      console.error('Error generating text file:', error);
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
        
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadDocx}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Download as Text
          </Button>
          
          <Button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-[#03d27c] hover:bg-[#03d27c]/90 text-white font-medium"
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