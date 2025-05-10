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
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/5">
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">Q</div>
            <span className="text-xl font-bold text-gray-900">Qwalify</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="link" className="text-gray-600">Features</Button>
            <Button variant="link" className="text-gray-600">Templates</Button>
            <Button variant="ghost" className="text-gray-600">Sign In</Button>
          </div>
        </div>
      </nav>
      
      <div className="container max-w-6xl mx-auto py-16 px-4 sm:px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Build Your Professional CV with Qwalify
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create a professional CV in minutes. Upload your existing CV for intelligent parsing, or start from scratch with our easy-to-use builder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Upload Option Card */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-primary/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full z-0"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Upload Your Existing CV</CardTitle>
              </div>
              <CardDescription className="text-base">
                Upload your existing CV in PDF or DOCX format. We'll extract the information automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-primary/5 hover:bg-primary/10 transition-colors">
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
                  <FileText className="h-16 w-16 mx-auto mb-4 text-primary/80" />
                  <p className="text-base text-gray-600">
                    Click to browse for your CV file
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Accepts PDF or DOCX format
                  </p>
                </label>
                
                {file && (
                  <div className="mt-4 p-3 bg-white border border-primary/20 rounded-lg flex items-center justify-between shadow-sm">
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-gray-500 hover:text-gray-700"
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
                className="w-full py-6 text-base font-medium"
                disabled={!file || isUploading}
                onClick={handleUpload}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Upload & Extract Data
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Start from Scratch Card */}
          <Card className="relative overflow-hidden border-2 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-primary/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full z-0"></div>
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Start From Scratch</CardTitle>
              </div>
              <CardDescription className="text-base">
                Build your CV step by step using our guided process with professional templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="bg-primary/5 rounded-xl p-6 hover:bg-primary/10 transition-colors">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                      <div className="rounded-full bg-primary h-2 w-2"></div>
                    </div>
                    <span className="text-base text-gray-700">Choose from professional templates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                      <div className="rounded-full bg-primary h-2 w-2"></div>
                    </div>
                    <span className="text-base text-gray-700">Fill in your information step by step</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                      <div className="rounded-full bg-primary h-2 w-2"></div>
                    </div>
                    <span className="text-base text-gray-700">Use AI to enhance your content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                      <div className="rounded-full bg-primary h-2 w-2"></div>
                    </div>
                    <span className="text-base text-gray-700">Customize the order of your sections</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-1.5 mt-0.5">
                      <div className="rounded-full bg-primary h-2 w-2"></div>
                    </div>
                    <span className="text-base text-gray-700">Download your finished CV as a PDF</span>
                  </li>
                </ul>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full py-6 text-base font-medium"
                onClick={handleStartFromScratch}
              >
                Start Building Your CV
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">Join thousands of job seekers who have successfully landed interviews with Qwalify</p>
          <div className="flex justify-center gap-6">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div className="w-3 h-3 rounded-full bg-primary/60"></div>
              <div className="w-3 h-3 rounded-full bg-primary/30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}