import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FilePlus, Upload, FileCheck, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function CVUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type (only PDF and DOCX)
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a PDF or Word document (.docx)');
        setFile(null);
        return;
      }
      
      // Reset error state if file is valid
      setError(null);
      setFile(selectedFile);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create form data to send file
      const formData = new FormData();
      formData.append('file', file);
      
      // Send file to server for parsing
      const response = await apiRequest('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to extract data from CV');
      }
      
      // Get parsed CV data
      const parsedData = await response.json();
      
      // Store parsed data in sessionStorage to pass to CV builder
      sessionStorage.setItem('importedCVData', JSON.stringify(parsedData));
      
      // Navigate to CV builder with imported flag
      setLocation('/cv-builder?imported=true');
      
    } catch (err) {
      console.error('Error uploading CV:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload CV');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildFromScratch = () => {
    // Clear any previously imported data
    sessionStorage.removeItem('importedCVData');
    setLocation('/cv-builder');
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            CV Builder
          </span>
        </h1>
        <p className="text-muted-foreground text-center max-w-xl mb-8">
          Create a professional CV in minutes. Upload an existing CV to get started faster or build from scratch.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Upload option */}
          <Card className="flex flex-col border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5 text-primary" />
                Upload existing CV
              </CardTitle>
              <CardDescription>
                Extract information from your current CV to save time
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {file ? (
                <div className="p-6 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 flex flex-col items-center justify-center text-center">
                  <FileCheck className="h-10 w-10 text-primary mb-2" />
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <Label htmlFor="cv-upload" className="cursor-pointer">
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg bg-muted/20 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF or Word document (.docx)
                    </p>
                  </div>
                  <input
                    id="cv-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                  />
                </Label>
              )}
              
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                disabled={!file || loading}
                onClick={handleFileUpload}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Continue with uploaded CV</>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* From scratch option */}
          <Card className="flex flex-col border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FilePlus className="mr-2 h-5 w-5 text-primary" />
                Build from scratch
              </CardTitle>
              <CardDescription>
                Create a new CV using our step-by-step builder
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              <div className="p-6 border-2 border-dashed border-muted rounded-lg bg-muted/20 flex flex-col items-center justify-center text-center w-full">
                <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mb-3">
                  <FilePlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Start with a blank template</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Our step-by-step process will guide you
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleBuildFromScratch}
              >
                Start from scratch
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}