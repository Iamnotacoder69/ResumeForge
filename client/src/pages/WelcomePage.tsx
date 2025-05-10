import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Upload, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export default function WelcomePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Mutation for uploading the CV
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      setUploadError(null);
      
      const formData = new FormData();
      formData.append('cvFile', file);
      
      try {
        // Step 1: Upload the file and get text content
        const uploadResponse = await fetch('/api/upload-cv', {
          method: 'POST',
          body: formData
        }).then(res => res.json());
        
        if (!uploadResponse.success) {
          throw new Error(uploadResponse.message || 'Failed to upload file');
        }
        
        // Step 2: Extract structured data from text content
        const extractResponse = await fetch('/api/extract-cv-data', {
          method: 'POST',
          body: JSON.stringify({ textContent: uploadResponse.textContent }),
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(res => res.json());
        
        if (!extractResponse.success) {
          throw new Error(extractResponse.message || 'Failed to extract data from CV');
        }
        
        return extractResponse;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "CV Uploaded Successfully",
        description: "Your CV has been parsed and is ready for editing!",
        variant: "default"
      });
      
      // Store the data and navigate immediately
      try {
        // Add debug logs to see the structure of the data
        console.log('Data received from server:', data);
        
        // We're passing the data via sessionStorage since it could be large
        // Extract the actual data from the response
        const cvData = data.data || data;
        sessionStorage.setItem('extractedCVData', JSON.stringify(cvData));
        console.log('Successfully stored CV data, navigating to builder...');
        
        // Navigate after a very short delay to ensure storage completes
        setTimeout(() => {
          navigate('/builder');
        }, 100);
      } catch (err) {
        console.error('Error storing CV data:', err);
        // Try to navigate anyway
        navigate('/builder');
      }
    },
    onError: (error: Error) => {
      setUploadError(error.message);
      toast({
        title: "Upload Failed",
        description: error.message || "There was an error uploading your CV. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check file type (PDF or DOCX)
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or DOCX file.",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadError(null);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
    }
  };

  const handleStartFromScratch = () => {
    // Remove any stored CV data from previous sessions
    sessionStorage.removeItem('extractedCVData');
    navigate('/builder');
  };

  return (
    <div className="qwalify-welcome-container">
      {/* Header */}
      <header className="qwalify-header py-5 mb-8">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            <span className="qwalify-logo">Qwalify</span>
            CV Builder
          </h1>
          <p className="text-center text-white/80 mt-2 max-w-2xl mx-auto">
            Create a professional CV in minutes. Upload your existing CV for intelligent parsing, or start from scratch.
          </p>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Upload Option Card */}
          <div className="qwalify-card qwalify-card-choice" onClick={() => !isUploading && document.getElementById('cv-upload')?.click()}>
            <div className="qwalify-icon-circle">
              <Upload className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload Your CV</h3>
            <p className="text-gray-600 mb-6">
              Upload your existing CV in PDF or DOCX format. We'll extract the information automatically.
            </p>
            
            <div className="relative">
              <input
                type="file"
                id="cv-upload"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              
              {file ? (
                <div className="p-3 bg-accent rounded-md flex items-center justify-between mb-4">
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-2"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-md p-4 text-center mb-4">
                  <p className="text-sm text-gray-500">
                    Click anywhere to browse for your CV file
                  </p>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 text-red-500 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
              
              <Button 
                className="w-full qwalify-primary-btn"
                disabled={!file || isUploading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upload & Extract Data
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Start from Scratch Card */}
          <div className="qwalify-card qwalify-card-choice" onClick={handleStartFromScratch}>
            <div className="qwalify-icon-circle">
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Start From Scratch</h3>
            <p className="text-gray-600 mb-6">
              Build your CV step by step using our guided process with professional templates.
            </p>
            
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-1 mt-1 flex-shrink-0">
                  <div className="rounded-full bg-primary h-2 w-2"></div>
                </div>
                <span className="text-sm text-gray-600">Choose from professional templates</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-1 mt-1 flex-shrink-0">
                  <div className="rounded-full bg-primary h-2 w-2"></div>
                </div>
                <span className="text-sm text-gray-600">Fill in your information step by step</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-1 mt-1 flex-shrink-0">
                  <div className="rounded-full bg-primary h-2 w-2"></div>
                </div>
                <span className="text-sm text-gray-600">Use AI to enhance your content</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-1 mt-1 flex-shrink-0">
                  <div className="rounded-full bg-primary h-2 w-2"></div>
                </div>
                <span className="text-sm text-gray-600">Customize the order of your sections</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/20 p-1 mt-1 flex-shrink-0">
                  <div className="rounded-full bg-primary h-2 w-2"></div>
                </div>
                <span className="text-sm text-gray-600">Download your finished CV as a PDF</span>
              </div>
            </div>
            
            <Button 
              className="w-full qwalify-primary-btn" 
              onClick={(e) => {
                e.stopPropagation();
                handleStartFromScratch();
              }}
            >
              Start Building Your CV
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="qwalify-footer py-4 mt-10">
        <div className="container mx-auto px-4">
          <p className="text-sm text-white/70">
            © 2025 Qwalify. Create professional CVs that get noticed.
          </p>
        </div>
      </footer>
    </div>
  );
}