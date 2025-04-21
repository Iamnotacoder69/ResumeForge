import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Download, ArrowLeft, FileWarning, RefreshCw } from "lucide-react";
import { CompleteCV } from "@shared/types";
import { toast } from "@/hooks/use-toast";

type PDFPreviewProps = {
  data: CompleteCV;
  onClose: () => void;
  onDownload: () => void;
};

const PDFPreview = ({ data, onClose, onDownload }: PDFPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const generatePreview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to generate PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Clean up previous URL if it exists
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      setError(error instanceof Error ? error.message : "Failed to generate PDF");
      setIsLoading(false);
      
      toast({
        title: "PDF Preview Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF preview",
        variant: "destructive",
      });
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
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleDownload = () => {
    if (pdfUrl) {
      onDownload();
    } else {
      toast({
        title: "Unable to Download",
        description: "Please wait for the preview to load or try again",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Card className="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Editor
          </Button>
          <h2 className="text-lg font-semibold">CV Preview</h2>
          <div className="flex space-x-2">
            <Button 
              onClick={handleDownload}
              disabled={isLoading || !pdfUrl}
              className={isLoading || !pdfUrl ? "opacity-50 cursor-not-allowed" : ""}
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close preview">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-4 bg-gray-100">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-gray-600">Generating PDF preview...</p>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full rounded border bg-white shadow-md"
              title="CV Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <FileWarning className="h-16 w-16 text-red-500" />
              <p className="text-red-500 font-medium">Failed to generate PDF preview</p>
              {error && <p className="text-sm text-gray-600 max-w-md text-center">{error}</p>}
              <Button onClick={generatePreview} variant="outline" className="mt-2">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PDFPreview;
