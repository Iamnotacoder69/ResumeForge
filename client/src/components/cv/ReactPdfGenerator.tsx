import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { CompleteCV } from '@shared/types';
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
  
  const handleGeneratePDF = () => {
    toast({
      title: "Generating PDF",
      description: "Your CV is being prepared for download...",
    });
    
    // Create a temporary container for the PDF renderer
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    // Create a React root in this container
    const root = document.createElement('div');
    container.appendChild(root);
    
    // Dynamically load dependencies
    Promise.all([
      import('react-dom/client'),
      import('./pdf-downloader/PDFDownloader')
    ]).then(([ReactDOM, PDFDownloaderModule]) => {
      const PDFDownloader = PDFDownloaderModule.default;
      
      // Render the PDF downloader
      const reactRoot = ReactDOM.createRoot(root);
      reactRoot.render(
        <React.StrictMode>
          <React.Suspense fallback={<div>Loading PDF generator...</div>}>
            <PDFDownloader 
              data={data} 
              onSuccess={() => {
                toast({
                  title: "Success",
                  description: "Your CV has been generated and is downloading",
                });
                // Clean up
                setTimeout(() => {
                  reactRoot.unmount();
                  document.body.removeChild(container);
                }, 1000);
              }}
              onError={(error: Error) => {
                console.error("PDF generation error:", error);
                toast({
                  title: "Error",
                  description: "Failed to generate PDF. Please try again.",
                  variant: "destructive",
                });
                // Clean up
                reactRoot.unmount();
                document.body.removeChild(container);
              }}
            />
          </React.Suspense>
        </React.StrictMode>
      );
    }).catch(err => {
      console.error("Failed to load PDF generator:", err);
      toast({
        title: "Error",
        description: "Failed to load PDF generator. Please try again.",
        variant: "destructive",
      });
      document.body.removeChild(container);
    });
  };

  return (
    <Button 
      className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white font-medium"
      onClick={handleGeneratePDF}
    >
      <FileText className="mr-2 h-4 w-4" />
      {showLabel ? "Download PDF (React-PDF)" : ""}
    </Button>
  );
};

export default ReactPdfGenerator;