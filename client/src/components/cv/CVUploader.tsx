import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, ArrowRight, Loader2, CheckCircle, FileUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { CompleteCV } from "@shared/types";
import { Progress } from "@/components/ui/progress";

type ParseCVResponse = {
  success: boolean;
  data: CompleteCV;
  message?: string;
}

type UploadCVResponse = {
  success: boolean;
  data: {
    filePath: string;
    fileType: string;
    originalName: string;
    needsConversion: boolean;
  };
  message?: string;
}

export default function CVUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'initial' | 'uploading' | 'ready' | 'analyzing'>('initial');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Handle CV uploading and conversion
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
      console.log("CV file uploaded successfully");
      setUploadedFilePath(data.data.filePath);
      setUploadedFileType(data.data.fileType);
      setUploadState('ready');
      
      toast({
        title: "CV uploaded successfully",
        description: selectedFile?.type === 'application/pdf' 
          ? "Your PDF has been converted and is ready for analysis." 
          : "Your document is ready for analysis.",
      });
    },
    onError: (error) => {
      console.error("Error uploading CV:", error);
      setUploadState('initial');
      
      let title = "Failed to upload CV";
      let description = error instanceof Error ? error.message : "Please check the file format and try again.";
      
      // Provide more user-friendly error messages
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("file size") || errorMsg.includes("too large")) {
          title = "File too large";
          description = "The file you uploaded is too large. Please try with a smaller file.";
        } else if (errorMsg.includes("format") || errorMsg.includes("type")) {
          title = "Unsupported format";
          description = "The file format is not supported. Please use PDF or Word documents only.";
        } else if (errorMsg.includes("server") || errorMsg.includes("connection")) {
          title = "Server error";
          description = "There was a problem connecting to the server. Please try again.";
        } else if (errorMsg.includes("convert") || errorMsg.includes("conversion")) {
          title = "PDF conversion failed";
          description = "We couldn't convert your PDF. It may be password-protected or corrupted.";
        }
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    },
  });
  
  // Handle CV analysis via API (second step)
  const parseCVMutation = useMutation({
    mutationFn: async (filePath: string) => {
      // Create the request with JSON body
      const options = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath })
      };
      
      const url = "/api/analyze-cv";
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze CV");
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
      setUploadState('initial');
      
      toast({
        title: "CV parsed successfully",
        description: "Your CV has been analyzed and the information has been extracted.",
      });
    },
    onError: (error) => {
      console.error("Error parsing CV:", error);
      setUploadState('ready'); // Go back to ready state to allow retry
      
      let title = "Failed to parse CV";
      let description = error instanceof Error ? error.message : "Please check the file format and try again.";
      
      // Provide more specific user guidance based on error type
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes("too large") || errorMsg.includes("token limit") || errorMsg.includes("too many tokens")) {
          title = "Document too complex";
          description = "Your CV contains too much text for our AI to process. Please try a simpler document or create from scratch.";
        } else if (errorMsg.includes("rate limit") || errorMsg.includes("openai")) {
          title = "AI service temporarily unavailable";
          description = "Our AI service is currently busy. Please try again in a few moments or create from scratch.";
        } else if (errorMsg.includes("invalid file") || errorMsg.includes("not supported")) {
          title = "Unsupported file format";
          description = "We couldn't process this file format. Please upload a standard PDF or Word document.";
        } else if (errorMsg.includes("text extraction") || errorMsg.includes("minimal text")) {
          title = "Text extraction failed";
          description = "We couldn't extract text from your document. It may be an image-based or scanned PDF.";
        }
      }
      
      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    },
  });
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Reset states when a new file is selected
      setUploadState('initial');
      setUploadedFilePath(null);
      setUploadedFileType(null);
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
      // Reset states when a new file is dropped
      setUploadState('initial');
      setUploadedFilePath(null);
      setUploadedFileType(null);
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
    
    // Set upload state
    setUploadState('uploading');
    
    // Build form data
    const formData = new FormData();
    formData.append("cv", selectedFile);
    
    // Call mutation to upload the file to the server
    uploadCVMutation.mutate(formData);
  };
  
  // Handle analyze button click
  const handleAnalyze = () => {
    if (!uploadedFilePath) {
      toast({
        variant: "destructive",
        title: "No file uploaded",
        description: "Please upload a file first.",
      });
      return;
    }
    
    // Set analyzing state
    setUploadState('analyzing');
    
    // Call mutation to analyze the uploaded file
    parseCVMutation.mutate(uploadedFilePath);
  };
  
  // Handle create from scratch button click
  const handleCreateFromScratch = () => {
    // Clear any previously parsed data from session storage
    sessionStorage.removeItem("parsedCV");
    navigate("/cv-builder");
  };
  
  // Render upload button based on state
  const renderUploadButton = () => {
    if (uploadState === 'initial') {
      return (
        <Button 
          onClick={handleUpload} 
          className="w-full"
          disabled={!selectedFile || uploadCVMutation.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload CV
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    } else if (uploadState === 'uploading') {
      return (
        <div className="w-full space-y-2">
          <Progress value={80} className="w-full" />
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {selectedFile?.type === 'application/pdf' 
              ? "Converting PDF to DOCX..." 
              : "Uploading document..."}
          </div>
        </div>
      );
    } else if (uploadState === 'ready') {
      return (
        <Button 
          onClick={handleAnalyze} 
          className="w-full"
          variant="default"
        >
          <FileText className="mr-2 h-4 w-4" />
          Analyze and Proceed
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    } else if (uploadState === 'analyzing') {
      return (
        <div className="w-full space-y-2">
          <Progress value={90} className="w-full" />
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing Document with AI...
          </div>
        </div>
      );
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
              Upload your existing CV and we'll extract the information automatically
            </CardDescription>
          </CardHeader>
          <CardContent>
            {uploadState !== 'ready' && uploadState !== 'analyzing' ? (
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
            ) : (
              <div className="border rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[200px] bg-primary/5">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">File Ready for Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedFile?.type === 'application/pdf' 
                    ? "Your PDF has been successfully converted to DOCX format" 
                    : "Your document has been successfully uploaded"}
                </p>
                <div className="flex items-center justify-center p-2 bg-muted rounded-md w-full">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-sm font-medium truncate">
                    {selectedFile?.name || "Document"}
                  </span>
                </div>
                
                {uploadState === 'analyzing' && (
                  <div className="mt-4 w-full">
                    <Alert className="bg-primary/10 border-primary/20">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <AlertTitle>Analyzing your CV</AlertTitle>
                      <AlertDescription className="text-sm">
                        Our AI is extracting information from your document. This may take a moment.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
            
            {/* Show alert about API usage */}
            {uploadState === 'initial' && (
              <Alert className="mt-4 bg-primary/5 text-primary border-primary/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription className="text-sm">
                  We use AI to analyze your CV and extract relevant information. The data will be automatically filled in the builder form.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            {renderUploadButton()}
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