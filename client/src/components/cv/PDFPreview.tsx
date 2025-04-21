import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, ArrowLeft } from "lucide-react";
import { CompleteCV } from "@shared/types";

type PDFPreviewProps = {
  data: CompleteCV;
  onClose: () => void;
  onDownload: () => void;
};

const PDFPreview = ({ data, onClose, onDownload }: PDFPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const generatePreview = async () => {
      try {
        const response = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to generate PDF: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setIsLoading(false);
      } catch (error) {
        console.error("Error generating PDF preview:", error);
        setIsLoading(false);
      }
    };
    
    generatePreview();
    
    // Cleanup function
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [data]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          <h2 className="text-lg font-semibold">CV Preview</h2>
          <div className="flex space-x-2">
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-4 bg-gray-100">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full rounded border"
              title="CV Preview"
            />
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
