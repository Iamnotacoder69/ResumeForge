import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('application/pdf') && 
        !file.type.match('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setUploadError("Please upload a PDF or Word document (.docx) only");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setProcessingProgress(10);

      // Create form data to send the file
      const formData = new FormData();
      formData.append('cvFile', file);

      // First API call: Upload file and convert to text
      const uploadResponse = await fetch('/api/upload-cv', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`File upload failed: ${uploadResponse.statusText}`);
      }

      setProcessingProgress(40);
      console.log("CV file uploaded successfully");

      const { textContent } = await uploadResponse.json();

      // Second API call: Extract CV data using OpenAI
      setProcessingProgress(60);
      const extractResponse = await fetch('/api/extract-cv-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textContent }),
      });

      if (!extractResponse.ok) {
        throw new Error(`Data extraction failed: ${extractResponse.statusText}`);
      }

      setProcessingProgress(90);
      const extractedData = await extractResponse.json();
      
      console.log("CV data extracted successfully:");
      console.log("Name: ", extractedData.personal?.firstName + " " + extractedData.personal?.lastName);
      console.log("Email:", extractedData.personal?.email);
      console.log("Skills:", 
        extractedData.keyCompetencies?.technicalSkills?.length || 0, "technical,", 
        extractedData.keyCompetencies?.softSkills?.length || 0, "soft");
      console.log("Experience entries:", extractedData.experience?.length || 0);

      // Store the extracted data in sessionStorage
      sessionStorage.setItem('extractedCVData', JSON.stringify(extractedData));
      
      console.log("Populating form with parsed CV data");
      setProcessingProgress(100);
      
      // Success toast
      toast({
        title: "CV Uploaded Successfully",
        description: "Your CV has been analyzed and data extracted. Continue to edit your CV.",
        duration: 5000,
      });

      // Redirect to the CV builder with the extracted data
      setTimeout(() => {
        setLocation("/builder?source=uploaded");
      }, 1000);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "An unknown error occurred");
      console.error("CV upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Start from scratch
  const startFromScratch = () => {
    // Clear any previously extracted data
    sessionStorage.removeItem('extractedCVData');
    // Navigate to the builder page
    setLocation("/builder?source=scratch");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
            Welcome to CV Builder Pro
          </h1>
          <p className="text-xl text-muted-foreground">
            Create a professional CV in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your CV
              </CardTitle>
              <CardDescription>
                Upload an existing CV to extract information automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="p-6 border-2 border-dashed rounded-lg border-muted-foreground/20 bg-muted/50 flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your PDF or Word document, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {uploadError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              )}

              {processingProgress !== null && (
                <div className="mt-4">
                  <div className="w-full bg-muted rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {processingProgress < 100 
                      ? `Processing your CV (${processingProgress}%)...` 
                      : 'Processing complete!'}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={triggerFileUpload} 
                className="w-full"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CV
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                Create From Scratch
              </CardTitle>
              <CardDescription>
                Build your CV step-by-step using our intuitive form builder
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="p-6 bg-muted/50 rounded-lg flex flex-col items-center justify-center text-center h-full">
                <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside text-left w-full">
                  <li>Choose from multiple professional templates</li>
                  <li>AI-powered writing suggestions for each section</li>
                  <li>Easy to organize and rearrange sections</li>
                  <li>One-click download as PDF</li>
                  <li>Optimized for ATS (Applicant Tracking Systems)</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startFromScratch} 
                variant="outline" 
                className="w-full"
                disabled={isUploading}
              >
                Start Building
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}