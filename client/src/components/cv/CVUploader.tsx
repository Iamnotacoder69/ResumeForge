import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  FileType,
  FileCog,
  FileOutput
} from "lucide-react";
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
    originalFileName: string;
  };
  message?: string;
}

export default function CVUploader() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStep, setUploadStep] = useState<'initial' | 'uploading' | 'uploaded' | 'converting' | 'converted' | 'analyzing'>('initial');
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [originalFileType, setOriginalFileType] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Handle initial CV upload to server
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
      console.log("File uploaded successfully:", data.data.filePath);
      
      // Update state with file path and type
      setUploadedFilePath(data.data.filePath);
      setUploadedFileType(data.data.fileType);
      
      // If it's a PDF that needs conversion, we keep original file type
      // Otherwise we update the step to uploaded
      if (originalFileType === 'application/pdf') {
        setUploadStep('uploaded'); // PDF needs conversion as a next step
      } else {
        setUploadStep('uploaded'); // DOCX doesn't need conversion
      }
      
      toast({
        title: "File uploaded successfully",
        description: originalFileType === 'application/pdf' 
          ? "Your PDF file is ready for conversion to a format we can analyze." 
          : "Your document is ready for analysis.",
      });
    },
    onError: (error) => {
      console.error("Error uploading CV:", error);
      setUploadStep('initial');
      toast({
        variant: "destructive",
        title: "Failed to upload CV",
        description: error instanceof Error ? error.message : "Please check the file format and try again.",
      });
    },
  });

  // Handle PDF to DOCX conversion
  const convertPDFMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const url = "/api/convert-pdf";
      const options = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath })
      };
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to convert PDF");
      }
      
      return response.json() as Promise<UploadCVResponse>;
    },
    onSuccess: (data) => {
      console.log("PDF converted successfully:", data.data.filePath);
      
      // Update state with new file path and type
      setUploadedFilePath(data.data.filePath);
      setUploadedFileType(data.data.fileType);
      
      // Update step to converted
      setUploadStep('converted');
      
      toast({
        title: "PDF converted successfully",
        description: "Your PDF has been converted to DOCX format and is ready for analysis.",
      });
    },
    onError: (error) => {
      console.error("Error converting PDF:", error);
      setUploadStep('uploaded'); // Go back to uploaded step so user can try again
      toast({
        variant: "destructive",
        title: "Failed to convert PDF",
        description: error instanceof Error ? error.message : "Please check the file and try again.",
      });
    },
  });

  // Handle CV analysis after upload/conversion
  const analyzeCVMutation = useMutation({
    mutationFn: async ({ filePath, fileType }: { filePath: string, fileType: string }) => {
      const url = "/api/analyze-cv";
      const options = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath, fileType })
      };
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
      
      // Reset state
      setUploadStep('initial');
      setSelectedFile(null);
      setUploadedFilePath(null);
      setUploadedFileType(null);
      setOriginalFileType(null);
      
      // Navigate to the CV builder with the parsed data
      navigate("/cv-builder");
      
      toast({
        title: "CV analyzed successfully",
        description: "Your CV has been analyzed and the information has been extracted.",
      });
    },
    onError: (error) => {
      console.error("Error analyzing CV:", error);
      
      // Depending on the original file type, go back to the appropriate state
      if (originalFileType === 'application/pdf') {
        setUploadStep('converted'); // Go back to converted state for PDFs
      } else {
        setUploadStep('uploaded'); // Go back to uploaded state for DOCXs
      }
      
      toast({
        variant: "destructive",
        title: "Failed to analyze CV",
        description: error instanceof Error ? error.message : "Please check the file and try again.",
      });
    },
  });
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setOriginalFileType(file.type); // Store the original file type
      setUploadStep('initial');
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
      setOriginalFileType(file.type); // Store the original file type
      setUploadStep('initial');
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
    
    // Set state to uploading
    setUploadStep('uploading');
    
    // Build form data
    const formData = new FormData();
    formData.append("cv", selectedFile);
    
    // Call mutation to send the file to the server
    uploadCVMutation.mutate(formData);
  };
  
  // Handle convert button click (Step 2, only for PDFs)
  const handleConvert = () => {
    if (!uploadedFilePath) {
      toast({
        variant: "destructive",
        title: "No file to convert",
        description: "Please upload a PDF file first.",
      });
      return;
    }
    
    // Set state to converting
    setUploadStep('converting');
    
    // Call mutation to convert the PDF
    convertPDFMutation.mutate(uploadedFilePath);
  };
  
  // Handle analyze button click (Step 3)
  const handleAnalyze = () => {
    if (!uploadedFilePath || !uploadedFileType) {
      toast({
        variant: "destructive",
        title: "No file to analyze",
        description: "Please upload a file first.",
      });
      return;
    }
    
    // Set state to analyzing
    setUploadStep('analyzing');
    
    // Call mutation to analyze the document
    analyzeCVMutation.mutate({
      filePath: uploadedFilePath,
      fileType: uploadedFileType
    });
  };
  
  // Handle create from scratch button click
  const handleCreateFromScratch = () => {
    // Clear any previously parsed data from session storage
    sessionStorage.removeItem("parsedCV");
    navigate("/cv-builder");
  };
  
  // Render the appropriate action button based on current step
  const renderActionButton = () => {
    if (uploadStep === 'initial') {
      return (
        <Button 
          onClick={handleUpload} 
          className="w-full"
          disabled={!selectedFile}
        >
          Upload CV
          <Upload className="ml-2 h-4 w-4" />
        </Button>
      );
    } else if (uploadStep === 'uploading') {
      return (
        <Button 
          className="w-full"
          disabled
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </Button>
      );
    } else if (uploadStep === 'uploaded' && originalFileType === 'application/pdf') {
      return (
        <Button 
          onClick={handleConvert} 
          className="w-full"
          variant="secondary"
        >
          Convert PDF to DOCX
          <FileOutput className="ml-2 h-4 w-4" />
        </Button>
      );
    } else if (uploadStep === 'converting') {
      return (
        <Button 
          className="w-full"
          disabled
          variant="secondary"
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Converting PDF to DOCX...
        </Button>
      );
    } else if (uploadStep === 'uploaded' || uploadStep === 'converted') {
      return (
        <Button 
          onClick={handleAnalyze} 
          className="w-full"
          variant="default"
        >
          Analyze and Proceed
          <FileCog className="ml-2 h-4 w-4" />
        </Button>
      );
    } else if (uploadStep === 'analyzing') {
      return (
        <Button 
          className="w-full"
          disabled
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing Document...
        </Button>
      );
    }
  };
  
  // Render appropriate content based on current step
  const renderUploadContent = () => {
    // Initial state, uploading state, or analyzing state
    if (uploadStep === 'initial' || uploadStep === 'uploading' || uploadStep === 'analyzing' || uploadStep === 'converting') {
      return (
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors ${
            dragActive ? "border-primary bg-primary/5" : 
            (uploadStep === 'initial' ? "border-muted-foreground/20" : "border-primary/40 bg-primary/5")
          }`}
          onDragEnter={uploadStep === 'initial' ? handleDrag : undefined}
          onDragOver={uploadStep === 'initial' ? handleDrag : undefined}
          onDragLeave={uploadStep === 'initial' ? handleDrag : undefined}
          onDrop={uploadStep === 'initial' ? handleDrop : undefined}
        >
          {uploadStep === 'uploading' ? (
            <>
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <div className="mb-2 font-medium">Uploading your document</div>
              <p className="text-sm text-muted-foreground mb-4">
                Please wait while we upload your document...
              </p>
              <Progress value={40} className="w-full max-w-[250px] h-2 mb-2" />
            </>
          ) : uploadStep === 'converting' ? (
            <>
              <FileOutput className="h-12 w-12 text-primary mb-4 animate-pulse" />
              <div className="mb-2 font-medium">Converting your PDF</div>
              <p className="text-sm text-muted-foreground mb-4">
                Converting your PDF to a format we can analyze...
              </p>
              <Progress value={65} className="w-full max-w-[250px] h-2 mb-2" />
            </>
          ) : uploadStep === 'analyzing' ? (
            <>
              <FileCog className="h-12 w-12 text-primary mb-4 animate-pulse" />
              <div className="mb-2 font-medium">Analyzing your CV</div>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI is extracting information from your document...
              </p>
              <Progress value={85} className="w-full max-w-[250px] h-2 mb-2" />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      );
    } 
    // Uploaded state for PDFs - waiting for conversion
    else if (uploadStep === 'uploaded' && originalFileType === 'application/pdf') {
      return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px] border-2 border-primary/30 rounded-lg bg-primary/5">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <div className="text-lg font-semibold mb-2">PDF uploaded successfully!</div>
          <p className="text-sm text-muted-foreground mb-6">
            Your PDF needs to be converted before we can analyze it.
          </p>
          
          <div className="flex items-center p-3 bg-background rounded-md w-full mb-2 border border-muted">
            <FileType className="h-5 w-5 mr-3 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{selectedFile?.name}</div>
              <div className="text-xs text-muted-foreground">
                PDF file ready for conversion to DOCX format
              </div>
            </div>
          </div>
          
          <p className="text-sm mt-4">
            Click "Convert PDF to DOCX" below to prepare your file for analysis
          </p>
        </div>
      );
    }
    // Either after conversion for PDFs or after upload for DOCXs - ready for analysis
    else if (uploadStep === 'uploaded' || uploadStep === 'converted') {
      return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px] border-2 border-primary/30 rounded-lg bg-primary/5">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <div className="text-lg font-semibold mb-2">
            {uploadStep === 'converted' ? 'PDF converted successfully!' : 'Document uploaded successfully!'}
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {uploadStep === 'converted' 
              ? 'Your PDF has been converted to DOCX and is ready for analysis.' 
              : 'Your document is ready for analysis.'}
          </p>
          
          <div className="flex items-center p-3 bg-background rounded-md w-full mb-2 border border-muted">
            <FileType className="h-5 w-5 mr-3 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{selectedFile?.name}</div>
              <div className="text-xs text-muted-foreground">
                {uploadStep === 'converted' 
                  ? 'Converted to DOCX format for better analysis' 
                  : 'Ready for analysis'}
              </div>
            </div>
          </div>
          
          <p className="text-sm mt-4">
            Click "Analyze and Proceed" below to extract your CV information
          </p>
        </div>
      );
    }
  };
  
  // Get the appropriate upload process explanation based on file type
  const getProcessDescription = () => {
    if (!selectedFile) return "Two steps: Upload your CV, then analyze it to extract information.";
    
    return selectedFile.type === 'application/pdf'
      ? "Three steps: Upload your PDF, convert it to DOCX format, then analyze it to extract information."
      : "Two steps: Upload your document, then analyze it to extract information.";
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
            {renderUploadContent()}
            
            {/* Show alert about the process */}
            {uploadStep === 'initial' && (
              <Alert className="mt-4 bg-primary/5 text-primary border-primary/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>
                  {selectedFile?.type === 'application/pdf' ? 'Three-step process' : 'Two-step process'}
                </AlertTitle>
                <AlertDescription className="text-sm">
                  {getProcessDescription()}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            {renderActionButton()}
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