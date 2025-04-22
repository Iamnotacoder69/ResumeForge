import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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
      const response = await apiRequest("/api/parse-cv", {
        method: "POST",
        body: formData,
      });
      
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
      
      // Save to session storage for retrieval on CVBuilder page
      sessionStorage.setItem("parsedCV", JSON.stringify(data.data));
      
      // Navigate to the CV builder with the parsed data
      navigate("/cv-builder");
      
      toast({
        title: "CV parsed successfully",
        description: "Your CV has been analyzed and the information has been extracted.",
      });
    },
    onError: (error) => {
      console.error("Error uploading CV:", error);
      toast({
        variant: "destructive",
        title: "Failed to parse CV",
        description: error instanceof Error ? error.message : "Please check the file format and try again.",
      });
    },
  });
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload existing CV card */}
        <Card className="relative shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Existing CV
            </CardTitle>
            <CardDescription>
              Upload your existing CV and we'll extract the information automatically
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
            
            {/* Show alert about API usage */}
            <Alert className="mt-4 bg-primary/5 text-primary border-primary/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription className="text-sm">
                We use AI to analyze your CV and extract relevant information. The data will be automatically filled in the builder form.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleUpload} 
              className="w-full"
              disabled={!selectedFile || parseCVMutation.isPending}
            >
              {parseCVMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Document...
                </>
              ) : (
                <>
                  Upload and Analyze
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Build from scratch card */}
        <Card className="shadow-md bg-gradient-to-b from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Build from Scratch
            </CardTitle>
            <CardDescription>
              Create a new CV step by step with our guided builder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center min-h-[200px] flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Start with a Clean Slate</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our intuitive CV builder will guide you through each section, providing tips and suggestions along the way.
              </p>
              <ul className="text-sm text-start mx-auto space-y-2">
                <li className="flex items-start">
                  <div className="rounded-full h-5 w-5 bg-primary/20 flex items-center justify-center text-xs mr-2 mt-0.5">✓</div>
                  Professional templates
                </li>
                <li className="flex items-start">
                  <div className="rounded-full h-5 w-5 bg-primary/20 flex items-center justify-center text-xs mr-2 mt-0.5">✓</div>
                  AI-powered text enhancement
                </li>
                <li className="flex items-start">
                  <div className="rounded-full h-5 w-5 bg-primary/20 flex items-center justify-center text-xs mr-2 mt-0.5">✓</div>
                  Customizable sections
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full border-primary/50 hover:bg-primary/10"
              onClick={handleCreateFromScratch}
            >
              Create from Scratch
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}