import React, { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import CVTemplate from './templates/CVTemplate';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

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
  
  // Function to generate and download DOCX file
  const handleDownloadDOCX = useCallback(() => {
    try {
      console.log("Generating DOCX document...");
      
      // Create a new Document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Name and title header
            new Paragraph({
              text: `${data.personal?.firstName || ''} ${data.personal?.lastName || ''}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            
            // Professional title
            new Paragraph({
              text: data.personal?.professionalTitle || '',
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            // Contact information
            new Paragraph({
              children: [
                new TextRun({ text: `Email: ${data.personal?.email || ''}`, break: 1 }),
                new TextRun({ text: `Phone: ${data.personal?.phone || ''}`, break: 1 }),
                data.personal?.linkedin ? 
                  new TextRun({ text: `LinkedIn: linkedin.com/in/${data.personal.linkedin}`, break: 1 }) : 
                  new TextRun({ text: '' }),
              ],
              spacing: { after: 400 },
              alignment: AlignmentType.CENTER,
            }),
            
            // Professional Summary heading
            new Paragraph({
              text: "PROFESSIONAL SUMMARY",
              heading: HeadingLevel.HEADING_2,
              thematicBreak: true,
              spacing: { after: 200 },
            }),
            
            // Professional Summary content
            new Paragraph({
              text: data.professional?.summary || '',
              spacing: { after: 400 },
            }),
            
            // Key Competencies
            ...(data.keyCompetencies?.technicalSkills?.length || data.keyCompetencies?.softSkills?.length ? [
              // Key Competencies heading
              new Paragraph({
                text: "KEY COMPETENCIES",
                heading: HeadingLevel.HEADING_2,
                thematicBreak: true,
                spacing: { after: 200 },
              }),
              
              // Technical Skills
              ...(data.keyCompetencies?.technicalSkills?.length ? [
                new Paragraph({
                  text: "Technical Skills:",
                  heading: HeadingLevel.HEADING_3,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: data.keyCompetencies?.technicalSkills?.join(", ") || '',
                  spacing: { after: 200 },
                }),
              ] : []),
              
              // Soft Skills
              ...(data.keyCompetencies?.softSkills?.length ? [
                new Paragraph({
                  text: "Soft Skills:",
                  heading: HeadingLevel.HEADING_3,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: data.keyCompetencies?.softSkills?.join(", ") || '',
                  spacing: { after: 400 },
                }),
              ] : []),
            ] : []),
            
            // Professional Experience
            ...(data.experience?.length ? [
              new Paragraph({
                text: "PROFESSIONAL EXPERIENCE",
                heading: HeadingLevel.HEADING_2,
                thematicBreak: true,
                spacing: { after: 200 },
              }),
              
              // Map through experiences
              ...(data.experience || []).flatMap(exp => [
                new Paragraph({
                  text: `${exp.jobTitle} - ${exp.companyName}`,
                  heading: HeadingLevel.HEADING_3,
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  text: `${exp.startDate} - ${exp.isCurrent ? 'Present' : (exp.endDate || '')}`,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  text: exp.responsibilities || '',
                  spacing: { after: 400 },
                }),
              ]),
            ] : []),
            
            // Education
            ...(data.education?.length ? [
              new Paragraph({
                text: "EDUCATION",
                heading: HeadingLevel.HEADING_2,
                thematicBreak: true,
                spacing: { after: 200 },
              }),
              
              // Map through education
              ...(data.education || []).flatMap(edu => [
                new Paragraph({
                  text: `${edu.major} - ${edu.schoolName}`,
                  heading: HeadingLevel.HEADING_3,
                  spacing: { after: 100 },
                }),
                new Paragraph({
                  text: `${edu.startDate} - ${edu.endDate || ''}`,
                  spacing: { after: 200 },
                }),
                ...(edu.achievements ? [
                  new Paragraph({
                    text: edu.achievements,
                    spacing: { after: 400 },
                  }),
                ] : []),
              ]),
            ] : []),
            
            // Additional sections can be added similarly
          ],
        }],
      });
      
      // Generate and save the document
      Packer.toBlob(doc).then(blob => {
        console.log("DOCX document generated successfully");
        const firstName = data.personal?.firstName || '';
        const lastName = data.personal?.lastName || '';
        const filename = `${firstName}_${lastName}_CV.docx`.replace(/\s+/g, '_');
        
        console.log("Starting DOCX download as:", filename);
        saveAs(blob, filename);
        console.log("DOCX downloaded successfully");
      });
      
    } catch (error) {
      console.error("Error generating DOCX:", error);
    }
  }, [data]);
  
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
            onClick={handleDownloadDOCX}
            variant="outline"
            className="flex items-center gap-2 border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10 font-medium"
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
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
            Download as DOCX
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