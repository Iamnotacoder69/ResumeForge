import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, ArrowLeft, RefreshCw, FileText, ExternalLink } from "lucide-react";
import { CompleteCV, TemplateType } from "@shared/types";
import { useIsMobile } from "@/hooks/use-mobile";

// Helper function to get template-specific styles
const getTemplateStyles = (template: TemplateType): string => {
  switch (template) {
    case 'minimalist':
      return 'text-gray-800 bg-gray-200 border border-gray-300';
    case 'professional':
      return 'text-blue-800 bg-blue-100 border border-blue-300';
    case 'creative':
      return 'text-purple-800 bg-purple-100 border border-purple-300';
    case 'academic':
      return 'text-teal-800 bg-teal-100 border border-teal-300';
    default:
      return 'text-gray-500 bg-gray-100';
  }
};

type PDFPreviewProps = {
  data: CompleteCV;
  onClose: () => void;
  onDownload: () => void;
};

const PDFPreview = ({ data, onClose, onDownload }: PDFPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Extract template settings from data or use defaults
  const templateType = data.templateSettings?.template || 'professional';
  const includePhoto = data.templateSettings?.includePhoto || false;
  
  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Clear previous PDF URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
      
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Ensure template settings are included
          templateSettings: {
            template: templateType,
            includePhoto: includePhoto,
            sectionOrder: data.templateSettings?.sectionOrder
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to generate PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    generatePreview();
    
    // Cleanup function
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="self-start">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">CV Preview</h2>
              <div className={`ml-2 text-xs ${getTemplateStyles(templateType)} rounded px-2 py-0.5`}>
                {templateType.charAt(0).toUpperCase() + templateType.slice(1)} Template
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can preview your CV at any time, even with incomplete information.
            </p>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-2'} self-end sm:self-auto`}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generatePreview}
              disabled={isLoading}
              className={isMobile ? 'w-full' : ''}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            {!isMobile && (
              <Button onClick={onDownload} disabled={isLoading || !pdfUrl}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="hidden sm:flex">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-4 bg-gray-100">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-600">Generating your CV preview...</p>
            </div>
          ) : errorMessage ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <p className="text-red-500 mb-2">Error generating PDF preview</p>
              <p className="text-sm text-gray-600">{errorMessage}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={generatePreview}
              >
                Try Again
              </Button>
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full flex flex-col">
              {!isMobile ? (
                // Desktop PDF viewer
                <iframe 
                  src={pdfUrl} 
                  className="w-full h-full rounded border"
                  title="CV Preview"
                />
              ) : (
                // Mobile-friendly PDF viewer alternative
                <div className="flex flex-col items-center justify-center h-full">
                  <FileText className="w-20 h-20 mb-4 text-primary opacity-80" />
                  <h3 className="text-lg font-semibold mb-1">PDF Preview Ready</h3>
                  <p className="text-sm text-gray-600 mb-4 text-center px-4">
                    Your CV has been generated and is ready to view or download
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <a 
                      href={pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-center gap-2 bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-opacity-90 text-center"
                    >
                      <ExternalLink className="h-4 w-4" /> Open PDF
                    </a>
                    <Button 
                      variant="outline" 
                      onClick={onDownload}
                      className="w-full py-3"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-red-500">Failed to generate PDF preview</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PDFPreview;
