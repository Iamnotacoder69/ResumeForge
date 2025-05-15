import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { CompleteCV } from '@shared/types';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ReactPdfGeneratorProps {
  data: CompleteCV;
  showLabel?: boolean;
}

const ReactPdfGenerator: React.FC<ReactPdfGeneratorProps> = ({ 
  data, 
  showLabel = true 
}) => {
  const { toast } = useToast();
  
  const handleGeneratePDF = async () => {
    toast({
      title: "Generating PDF",
      description: "Your CV is being prepared for download...",
    });
    
    try {
      // Find the CV template in the DOM
      const template = document.querySelector('.cv-template-wrapper');
      if (!template) {
        throw new Error('CV template not found in the document');
      }
      
      // Create filename
      const firstName = data.personal?.firstName || '';
      const lastName = data.personal?.lastName || '';
      const pdfFileName = `${firstName}_${lastName}_CV`.replace(/\s+/g, '_') + '.pdf';
      
      // Use html2canvas to capture the CV template
      const canvas = await html2canvas(template as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      // A4 size in points (72 DPI)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasRatio = canvas.height / canvas.width;
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth * canvasRatio;
      
      // Add image to PDF
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // If the CV is taller than one page, add more pages
      if (imgHeight > pdfHeight) {
        let remainingHeight = imgHeight;
        let currentPosition = -pdfHeight;
        
        while (remainingHeight > pdfHeight) {
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, currentPosition, imgWidth, imgHeight);
          remainingHeight -= pdfHeight;
          currentPosition -= pdfHeight;
        }
      }
      
      // Save the PDF
      pdf.save(pdfFileName);
      
      toast({
        title: "Success",
        description: "Your CV has been generated and downloaded",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white font-medium"
      onClick={handleGeneratePDF}
    >
      <FileText className="mr-2 h-4 w-4" />
      {showLabel ? "Download PDF" : ""}
    </Button>
  );
};

export default ReactPdfGenerator;