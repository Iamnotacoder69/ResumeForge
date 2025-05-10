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
    <div className="container max-w-6xl mx-auto py-12 px-4 sm:px-6 min-h-[calc(100vh-15rem)]">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-[#03d27c] to-[#03d27c]/70 bg-clip-text text-transparent">
          Qwalify
        </h1>
        <p className="text-xl text-[#043e44] max-w-2xl mx-auto">
          Create a professional CV in minutes. Upload your existing CV for intelligent parsing, or start from scratch.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {/* Upload Option Card */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-[#043e44]">
              <Upload className="h-5 w-5 text-[#03d27c]" />
              <span>Upload Your Existing CV</span>
            </CardTitle>
            <CardDescription className="text-[#043e44]/80">
              Upload your existing CV in PDF or DOCX format. We'll extract the information automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed border-[#03d27c]/50 rounded-lg p-6 text-center bg-[#03d27c]/5">
              <input
                type="file"
                id="cv-upload"
                accept=".pdf,.docx"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <label 
                htmlFor="cv-upload"
                className="cursor-pointer block mb-4"
              >
                <FileText className="h-12 w-12 mx-auto mb-3 text-[#03d27c]/70" />
                <p className="text-sm text-[#043e44]">
                  Click to browse for your CV file (PDF or DOCX)
                </p>
              </label>
              
              {file && (
                <div className="mt-4 p-2 bg-primary/10 rounded flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    Change
                  </Button>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4">
            <Button 
              className="w-full bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
              disabled={!file || isUploading}
              onClick={handleUpload}
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
          </CardFooter>
        </Card>

        {/* Start from Scratch Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-[#043e44]">
              <FileText className="h-5 w-5 text-[#03d27c]" />
              <span>Start From Scratch</span>
            </CardTitle>
            <CardDescription className="text-[#043e44]/80">
              Build your CV step by step using our guided process with professional templates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-[#03d27c]/20 p-1 mt-0.5">
                    <div className="rounded-full bg-[#03d27c] h-1.5 w-1.5"></div>
                  </div>
                  <span className="text-sm text-[#043e44]">Choose from professional templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-[#03d27c]/20 p-1 mt-0.5">
                    <div className="rounded-full bg-[#03d27c] h-1.5 w-1.5"></div>
                  </div>
                  <span className="text-sm text-[#043e44]">Fill in your information step by step</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-[#03d27c]/20 p-1 mt-0.5">
                    <div className="rounded-full bg-[#03d27c] h-1.5 w-1.5"></div>
                  </div>
                  <span className="text-sm text-[#043e44]">Use AI to enhance your content</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-[#03d27c]/20 p-1 mt-0.5">
                    <div className="rounded-full bg-[#03d27c] h-1.5 w-1.5"></div>
                  </div>
                  <span className="text-sm text-[#043e44]">Customize the order of your sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-[#03d27c]/20 p-1 mt-0.5">
                    <div className="rounded-full bg-[#03d27c] h-1.5 w-1.5"></div>
                  </div>
                  <span className="text-sm text-[#043e44]">Download your finished CV as a PDF</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10" 
              variant="outline"
              onClick={handleStartFromScratch}
            >
              Start Building Your CV
              <ArrowRight className="ml-2 h-4 w-4 text-[#03d27c]" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Random button that does nothing */}
      <div className="mt-12 text-center">
        <Button 
          variant="secondary" 
          size="sm" 
          className="rounded-full h-8 w-8 p-0"
          onClick={() => console.log("This button does nothing")}
        >
          ✨
        </Button>
      </div>
    </div>
  );
}