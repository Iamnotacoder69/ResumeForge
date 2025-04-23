import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { CompleteCV } from "@shared/types";

type ParseCVResponse = {
  success: boolean;
  data: CompleteCV;
  message?: string;
}

export default function CVUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Handle CV parsing via API
  const parseCVMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Using the standard fetch API
      const url = "/api/parse-cv";
      const options = {
        method: "POST",
        body: formData
      };
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to parse CV");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("CV data extracted successfully:");
      console.log("Name: ", data.data.personal.firstName + " " + data.data.personal.lastName);
      console.log("Email:", data.data.personal.email);
      console.log("Skills:", 
        data.data.keyCompetencies?.technicalSkills?.length || 0, "technical,", 
        data.data.keyCompetencies?.softSkills?.length || 0, "soft"
      );
      console.log("Experience entries:", data.data.experience?.length || 0);
      
      // Store the parsed data in session storage
      console.log("Populating form with parsed CV data");
      sessionStorage.setItem("parsedCV", JSON.stringify(data.data));
      
      // Navigate to the CV builder page
      navigate("/cv-builder");
      
      // Show success message
      toast({
        title: "CV parsed successfully",
        description: "Your CV data has been extracted and populated in the builder.",
      });
    },
    onError: (error: Error) => {
      console.error("Error uploading CV:", error);
      
      // Show error message
      toast({
        variant: "destructive",
        title: "Failed to parse CV",
        description: error.message || "An error occurred while parsing your CV. Please try again.",
      });
    }
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };
  
  // Handle upload button click
  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a file to upload.",
      });
      return;
    }
    
    // Validate file type
    const allowedTypes = ["application/pdf", "application/msword", 
                         "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF or Word document (.pdf, .doc, .docx).",
      });
      return;
    }
    
    // Build form data
    const formData = new FormData();
    formData.append("cv", selectedFile);
    
    // Call mutation to send the file to the server
    parseCVMutation.mutate(formData);
  };
  
  // Handle create from scratch button click
  const handleCreateFromScratch = () => {
    // Clear any previously parsed data from session storage
    sessionStorage.removeItem("parsedCV");
    navigate("/cv-builder");
  };
  
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
        Professional CV Builder
      </h1>
      <p className="text-lg text-center mb-12 text-muted-foreground">
        Create a standout CV or upload an existing one to get started
      </p>
      
      <div className="max-w-2xl mx-auto">
        {/* Single Upload CV card */}
        <Card className="relative shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <Upload className="h-6 w-6 mr-2" />
              Upload CV
            </CardTitle>
            <CardDescription className="text-center">
              Upload your CV in any format - we'll convert it to DOCX and extract the information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="font-medium mb-2 cursor-pointer text-primary">
                Click to upload
              </Label>
              <p className="text-sm text-muted-foreground mb-4">
                or drag and drop your file here
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX
              </p>
              <Input 
                id="file-upload" 
                type="file" 
                accept=".pdf,.doc,.docx" 
                onChange={handleFileChange} 
                className="hidden"
              />
              
              {selectedFile && (
                <div className="mt-4 flex items-center justify-center p-2 bg-muted rounded-md w-full">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </span>
                </div>
              )}
            </div>
            
            {/* Show alert about AI usage */}
            <Alert className="mt-4 bg-primary/5 text-primary border-primary/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription className="text-sm">
                We'll automatically convert your file to DOCX format and extract all relevant information using AI. The data will be auto-filled in the CV builder form.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-between gap-4">
            <Button 
              variant="outline"
              onClick={handleCreateFromScratch}
              className="w-full"
            >
              Create Blank CV <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              disabled={!selectedFile || parseCVMutation.isPending} 
              onClick={handleUpload}
              className="w-full"
            >
              {parseCVMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload CV"
              )}
            </Button>
          </CardFooter>
          
          {/* Processing overlay */}
          {parseCVMutation.isPending && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="font-semibold text-xl mb-2">Processing your CV</h3>
              <p className="text-muted-foreground text-center max-w-xs">
                Converting your file and extracting information. This may take a moment...
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}