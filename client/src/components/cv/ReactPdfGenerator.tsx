import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CompleteCV } from '@shared/types';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import ProfessionalPdfTemplate from './pdf-templates/ProfessionalPdfTemplate';
import { useToast } from '@/hooks/use-toast';

interface ReactPdfGeneratorProps {
  data: CompleteCV;
  showLabel?: boolean;
}

const ReactPdfGenerator: React.FC<ReactPdfGeneratorProps> = ({ 
  data, 
  showLabel = true 
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  
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

  return (
    <PDFDownloadLink 
      document={getTemplate()}
      fileName={pdfFileName}
      className="inline-flex"
      onClick={() => {
        setIsGenerating(true);
        toast({
          title: "Generating PDF",
          description: "Your CV is being generated, please wait...",
        });
      }}
    >
      {({ loading, error }) => {
        // Handle errors
        if (error) {
          console.error("Error generating PDF:", error);
          toast({
            title: "Error",
            description: "Failed to generate PDF. Please try again.",
            variant: "destructive",
          });
        }
        
        // Update state once loading completes
        if (isGenerating && !loading && !error) {
          setIsGenerating(false);
          toast({
            title: "Success",
            description: "Your CV has been generated and is downloading now",
          });
        }
        
        return (
          <Button 
            className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white font-medium"
            disabled={loading}
          >
            <FileText className="mr-2 h-4 w-4" />
            {loading ? "Generating..." : (showLabel ? "Download PDF (React-PDF)" : "")}
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
};

export default ReactPdfGenerator;