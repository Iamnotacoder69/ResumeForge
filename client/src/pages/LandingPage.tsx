import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { FileText, Upload, PlusCircle, ArrowRight } from "lucide-react";
import { CompleteCV } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError(null);
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('application/json')) {
      setUploadError('Please select a JSON file from a previously created CV');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size should be less than 5MB');
      return;
    }
    
    setUploadedFile(file);
  };
  
  // Handle CV upload and parsing
  const handleUploadCV = async () => {
    if (!uploadedFile) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Read file content
      const reader = new FileReader();
      
      const fileReadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(uploadedFile);
      });
      
      const fileContent = await fileReadPromise;
      
      // Parse JSON
      let cvData: CompleteCV;
      try {
        cvData = JSON.parse(fileContent);
      } catch (e) {
        throw new Error('Invalid JSON format');
      }
      
      // Validate the CV data structure (simplified check)
      if (!cvData.personal || !cvData.personal.firstName) {
        throw new Error('Invalid CV format: missing required fields');
      }
      
      // Create a new CV using the uploaded data
      const response = await fetch('/api/cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cvData),
      });
      
      // Navigate to the CV builder with the new CV ID
      const result = await response.json();
      setLocation(`/cv/edit/${result.id}`);
    } catch (error) {
      console.error('Failed to process CV:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to process CV file');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle starting a new CV
  const handleStartNew = () => {
    setLocation('/cv/template');
  };
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-10 min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-3">CV Builder</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Create professional CVs with ease. Start from scratch or upload an existing CV to continue editing.
        </p>
      </div>
      
      <Tabs defaultValue="new" className="w-full max-w-3xl">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New CV
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Existing CV
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create a New CV</CardTitle>
              <CardDescription>
                Start fresh and build your CV step by step
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center py-8">
                <div className="bg-primary/10 p-6 rounded-full">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                
                <div className="text-center sm:text-left">
                  <h3 className="text-lg font-semibold mb-2">Get Started</h3>
                  <p className="text-muted-foreground">
                    Choose a template and follow the guided process to create your professional CV
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleStartNew}>
                Create New CV
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Existing CV</CardTitle>
              <CardDescription>
                Continue working on a previously created CV by uploading the JSON file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <Label 
                    htmlFor="cv-upload"
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 w-full text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-10 w-10 text-muted-foreground/70" />
                      <p className="font-medium">
                        {uploadedFile ? uploadedFile.name : "Drop or select your CV file"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JSON files only, up to 5MB
                      </p>
                    </div>
                    <input
                      id="cv-upload"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </Label>
                  
                  {uploadError && (
                    <p className="text-destructive text-sm mt-2">{uploadError}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleUploadCV}
                disabled={!uploadedFile || isUploading}
              >
                {isUploading ? 'Processing...' : 'Upload and Continue'}
                {!isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}