import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CompleteCV } from '@shared/types';
import CVTemplate from './templates/CVTemplate';
import { Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface PDFPreviewProps {
  data: CompleteCV;
  onClose?: () => void;
}

/**
 * PDF Preview component that allows for downloading the CV as a PDF
 * using html2pdf.js client-side PDF generation library
 */
const PDFPreview: React.FC<PDFPreviewProps> = ({ data, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize html2pdf options
  const html2pdfOptions = {
    margin: 10,
    filename: `${data.personal?.firstName || ''}_${data.personal?.lastName || ''}_CV.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false,
      dpi: 300,
      imageTimeout: 0
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
      compress: true
    },
    fontFaces: [
      {
        family: 'Inter',
        weight: 'normal',
      },
      {
        family: 'Inter',
        weight: 'bold',
      }
    ]
  };
  
  const handleGeneratePDF = useCallback(async () => {
    if (!printRef.current) return;
    
    try {
      setIsGenerating(true);
      
      // Create a styled version for PDF export
      const pdfContent = document.createElement('div');
      pdfContent.innerHTML = printRef.current.innerHTML;
      
      // Apply PDF-specific styles
      const style = document.createElement('style');
      style.textContent = `
        body {
          font-family: 'Inter', 'Helvetica', Arial, sans-serif;
          color: #333;
          line-height: 1.5;
        }
        h1, h2, h3, h4 {
          margin-top: 0;
          color: #043e44;
          font-weight: bold;
        }
        h1 { font-size: 20pt; margin-bottom: 5pt; }
        h2 { font-size: 16pt; margin-bottom: 5pt; border-bottom: 1pt solid #03d27c; padding-bottom: 3pt; }
        h3 { font-size: 14pt; margin-bottom: 3pt; }
        ul { margin-top: 5pt; margin-bottom: 5pt; padding-left: 15pt; }
        li {
          position: relative;
          list-style-type: disc;
          margin-bottom: 3pt;
        }
        li::before {
          content: "•";
          position: absolute;
          left: -15pt;
          color: #03d27c;
        }
        .date-range {
          font-style: italic;
          color: #666;
          font-size: 10pt;
        }
        .job-title, .degree {
          font-weight: bold;
        }
        .company, .school {
          font-weight: 500;
        }
        .section {
          margin-bottom: 15pt;
        }
      `;
      pdfContent.appendChild(style);
      
      // Fix bullet points for list items
      const listItems = pdfContent.querySelectorAll('li');
      listItems.forEach(item => {
        if (!item.textContent?.trim().startsWith('•')) {
          item.innerHTML = '• ' + item.innerHTML;
        }
      });
      
      // Ensure all images are loaded
      const images = pdfContent.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
      
      // Generate PDF using html2pdf
      await html2pdf()
        .set(html2pdfOptions)
        .from(pdfContent)
        .save();
        
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [data, html2pdfOptions, printRef]);
  
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