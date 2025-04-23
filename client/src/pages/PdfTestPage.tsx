import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Download, Save, Loader2 } from "lucide-react";

export default function PdfTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [convertedFilePath, setConvertedFilePath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadedFilePath(null);
      setConvertedFilePath(null);
    }
  };

  // Handle upload button click
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a PDF file to upload.",
      });
      return;
    }

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Build form data
      const formData = new FormData();
      formData.append("cv", selectedFile);

      // Send the file to the server
      const response = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload PDF");
      }

      const data = await response.json();
      
      if (data.success) {
        setUploadedFilePath(data.data.filePath);
        toast({
          title: "PDF uploaded successfully",
          description: "Your PDF is ready for conversion.",
        });
      } else {
        throw new Error(data.message || "Failed to upload PDF");
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle convert button click
  const handleConvert = async () => {
    if (!uploadedFilePath) {
      toast({
        variant: "destructive",
        title: "No file uploaded",
        description: "Please upload a PDF file first.",
      });
      return;
    }

    setIsConverting(true);

    try {
      // Call the convert-pdf endpoint
      const response = await fetch("/api/convert-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: uploadedFilePath }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to convert PDF to DOCX");
      }

      const data = await response.json();
      
      if (data.success) {
        setConvertedFilePath(data.data.filePath);
        toast({
          title: "PDF converted successfully",
          description: "Your PDF has been converted to DOCX format.",
        });
      } else {
        throw new Error(data.message || "Failed to convert PDF to DOCX");
      }
    } catch (error) {
      console.error("Error converting PDF:", error);
      toast({
        variant: "destructive",
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An error occurred during conversion",
      });
    } finally {
      setIsConverting(false);
    }
  };

  // Handle download buttons
  const handleDownloadFile = async (filePath: string, fileType: string) => {
    try {
      const response = await fetch("/api/download-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileType === 'pdf' ? 'converted.pdf' : 'converted.docx';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: `Your ${fileType.toUpperCase()} file is being downloaded.`,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "An error occurred during download",
      });
    }
  };

  // Handle download text button
  const handleDownloadText = async () => {
    if (!uploadedFilePath) return;
    
    try {
      const textPath = uploadedFilePath.replace('.pdf', '.txt');
      
      const response = await fetch("/api/download-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filePath: textPath }),
      });

      if (!response.ok) {
        throw new Error("Failed to download text file");
      }

      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'extracted-text.txt';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "The extracted text file is being downloaded.",
      });
    } catch (error) {
      console.error("Error downloading text file:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error instanceof Error ? error.message : "An error occurred during download",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">PDF Conversion Test</CardTitle>
          <CardDescription>Upload a PDF to test the conversion to DOCX</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pdf-upload">Select PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="mt-1"
              />
              {selectedFile && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload PDF
                  </>
                )}
              </Button>

              <Button
                onClick={handleConvert}
                disabled={!uploadedFilePath || isConverting}
                variant="secondary"
                className="w-full"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Convert PDF to DOCX
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {uploadedFilePath && (
            <Button
              onClick={() => handleDownloadFile(uploadedFilePath, 'pdf')}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Original PDF
            </Button>
          )}

          {convertedFilePath && (
            <Button
              onClick={() => handleDownloadFile(convertedFilePath, 'docx')}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Converted DOCX
            </Button>
          )}

          {uploadedFilePath && (
            <Button
              onClick={handleDownloadText}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Extracted Text
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}