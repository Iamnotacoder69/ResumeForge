import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, ArrowRight, Loader2, FileCheck, FileWarning } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { CompleteCV } from "@shared/types";
import { Progress } from "@/components/ui/progress";

type UploadCVResponse = {
  success: boolean;
  data: {
    originalPath: string;
    originalType: string;
    originalName: string;
    convertedPath: string;
    needsConversion: boolean;
  };
  warning?: string;
  message?: string;
}

type ParseCVResponse = {
  success: boolean;
  data: CompleteCV;
  message?: string;
}

export default function CVUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'converting' | 'ready' | 'analyzing'>('idle');
  const [fileInfo, setFileInfo] = useState<UploadCVResponse['data'] | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Handle CV upload (Step 1)
  const uploadCVMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const url = "/api/upload-cv";
      const options = {
        method: "POST",
        body: formData
      };
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload CV");
      }
      
      return response.json() as Promise<UploadCVResponse>;
    },
    onSuccess: (data) => {
      console.log("CV uploaded successfully:", data);
      
      // Check if there was a warning
      if (data.warning) {
        toast({
          title: "Upload completed with warning",
          description: data.warning,
          variant: "default"
        });
      }
      
      // Store file info for Step 2
      setFileInfo(data.data);
      
      // Set upload state to ready
      setUploadState('ready');
      
      // If there's a warning about PDFs, show it to the user
      if (data.warning && data.data.originalType === "application/pdf") {
        toast({
          title: "PDF document detected",
          description: data.warning,
          variant: "default"
        });
      }
    },
    onError: (error) => {
      console.error("Error uploading CV:", error);
      setUploadState('idle');
      toast({
        variant: "destructive",
        title: "Failed to upload CV",
        description: error instanceof Error ? error.message : "Please check the file format and try again.",
      });
    }
  });
  
  // Handle CV parsing (Step 2)
  const parseCVMutation = useMutation({
    mutationFn: async (fileData: { filePath: string; fileType: string }) => {
      const response = await fetch("/api/parse-cv", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fileData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to parse CV");
      }
      
      return response.json() as Promise<ParseCVResponse>;
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
      
      // Reset state
      setUploadState('idle');
      setFileInfo(null);
      setSelectedFile(null);
    },
    onError: (error) => {
      console.error("Error parsing CV:", error);
      setUploadState('ready'); // Go back to ready state to allow trying again
      toast({
        variant: "destructive",
        title: "Failed to parse CV",
        description: error instanceof Error ? error.message : "Please check the file format and try again.",
      });
    }
  });
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadState('idle'); // Reset to idle state with new file
      setFileInfo(null); // Clear any previous file info
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
      setUploadState('idle'); // Reset to idle state with new file
      setFileInfo(null); // Clear any previous file info
    }
  };
  
  // Handle upload button click (Step 1)
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
    
    // Update state to show we're uploading
    setUploadState('uploading');
    
    // Build form data
    const formData = new FormData();
    formData.append("cv", selectedFile);
    
    // Call mutation to upload the file to the server
    uploadCVMutation.mutate(formData);
  };
  
  // Handle analyze button click (Step 2)
  const handleAnalyze = () => {
    if (!fileInfo) {
      toast({
        variant: "destructive",
        title: "No file information",
        description: "Please upload a file first.",
      });
      return;
    }
    
    // Update state to show we're analyzing
    setUploadState('analyzing');
    
    // Call mutation to parse the file
    parseCVMutation.mutate({
      filePath: fileInfo.convertedPath || fileInfo.originalPath,
      fileType: fileInfo.convertedPath.endsWith('.docx') 
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        : fileInfo.originalType
    });
  };
  
  // Handle create from scratch button click
  const handleCreateFromScratch = () => {
    // Clear any previously parsed data from session storage
    sessionStorage.removeItem("parsedCV");
    navigate("/cv-builder");
  };
  
  // Get the appropriate button label and state for the upload card
  const getUploadButtonContent = () => {
    switch (uploadState) {
      case 'uploading':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        );
      case 'converting':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Converting PDF to DOCX...
          </>
        );
      case 'ready':
        return (
          <>
            <FileCheck className="mr-2 h-4 w-4" />
            Analyze and Proceed
          </>
        );
      case 'analyzing':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing Document...
          </>
        );
      default:
        return (
          <>
            Upload CV
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        );
    }
  };
  
  // Get the appropriate step label
  const getStepLabel = () => {
    if (uploadState === 'idle' || uploadState === 'uploading') {
      return "Step 1: Upload your CV document";
    } else if (uploadState === 'converting') {
      return "Converting PDF to Word format...";
    } else if (uploadState === 'ready') {
      return "Step 2: Analyze your CV document";
    } else {
      return "Analyzing your CV...";
    }
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
              {getStepLabel()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show progress bar during uploading/converting/analyzing */}
            {(uploadState === 'uploading' || uploadState === 'converting' || uploadState === 'analyzing') && (
              <div className="mb-6">
                <p className="text-sm mb-2 text-center font-medium">
                  {uploadState === 'uploading' ? 'Uploading file...' : 
                   uploadState === 'converting' ? 'Converting PDF to Word format...' :
                   'Analyzing document content...'}
                </p>
                <Progress 
                  value={uploadState === 'uploading' ? 30 : 
                         uploadState === 'converting' ? 60 : 
                         uploadState === 'analyzing' ? 80 : 0} 
                  className="h-2" 
                />
              </div>
            )}
            
            {/* Show file drop zone only when not ready for analysis */}
            {uploadState !== 'ready' && uploadState !== 'analyzing' && (
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
                  disabled={uploadState === 'uploading' || uploadState === 'converting'}
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
            )}
            
            {/* Show ready state when file is uploaded and converted */}
            {uploadState === 'ready' && (
              <div className="border-2 border-primary/20 bg-primary/5 rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FileCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">CV Ready for Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your document has been uploaded successfully.
                  {fileInfo?.originalType === "application/pdf" && (
                    <span className="block text-amber-600 mt-1 font-medium">
                      Note: PDF files may have limited extraction ability.
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-center p-2 bg-muted rounded-md w-full">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium truncate">
                    {fileInfo?.originalName || "Document"}
                  </span>
                </div>
              </div>
            )}
            
            {/* Show alert about how it works */}
            <Alert className="mt-4 bg-primary/5 text-primary border-primary/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription className="text-sm">
                {uploadState === 'ready' 
                  ? "Click 'Analyze and Proceed' to extract information from your CV using AI. This process works best with Word documents."
                  : "We use AI to analyze your CV and extract relevant information. For better results, PDF files will be converted to Word format automatically."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            {uploadState === 'ready' ? (
              // Show analyze button in ready state
              <Button 
                onClick={handleAnalyze} 
                className="w-full"
                disabled={parseCVMutation.isPending}
              >
                {getUploadButtonContent()}
              </Button>
            ) : (
              // Show upload button in other states
              <Button 
                onClick={handleUpload} 
                className="w-full"
                disabled={!selectedFile || uploadState === 'uploading' || uploadState === 'converting' || uploadState === 'analyzing'}
              >
                {getUploadButtonContent()}
              </Button>
            )}
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