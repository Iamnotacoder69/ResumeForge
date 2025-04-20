import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Eye, HelpCircle } from "lucide-react";
import PersonalInfoSection from "@/components/cv/PersonalInfoSection";
import SummarySection from "@/components/cv/SummarySection";
import ExperienceSection from "@/components/cv/ExperienceSection";
import EducationSection from "@/components/cv/EducationSection";
import CertificatesSection from "@/components/cv/CertificatesSection";
import AdditionalInfoSection from "@/components/cv/AdditionalInfoSection";
import PDFPreview from "@/components/cv/PDFPreview";
import { useCVForm } from "@/lib/hooks/use-cv-form";
import { FormProvider } from "react-hook-form";

enum CVTabs {
  PERSONAL = "personal",
  EXPERIENCE = "experience",
  EDUCATION = "education",
  ADDITIONAL = "additional",
}

const CVBuilder = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<CVTabs>(CVTabs.PERSONAL);
  const [showPreview, setShowPreview] = useState(false);
  const form = useCVForm();
  
  const progressMap = {
    [CVTabs.PERSONAL]: 25,
    [CVTabs.EXPERIENCE]: 50,
    [CVTabs.EDUCATION]: 75,
    [CVTabs.ADDITIONAL]: 100,
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate-pdf", data);
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a download link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.getValues().personal.firstName}_${form.getValues().personal.lastName}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success!",
        description: "Your CV has been generated and downloaded",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/cv", data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your CV has been saved",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save CV: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    submitMutation.mutate(data);
  });

  const saveAsDraft = () => {
    if (form.formState.isValid) {
      saveMutation.mutate(form.getValues());
    } else {
      form.trigger();
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    if (form.formState.isValid) {
      setShowPreview(true);
    } else {
      form.trigger();
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {showPreview ? (
        <PDFPreview 
          data={form.getValues()} 
          onClose={() => setShowPreview(false)}
          onDownload={() => submitMutation.mutate(form.getValues())}
        />
      ) : (
        <>
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="text-primary text-2xl mr-3" />
                  <h1 className="text-2xl font-bold text-neutral-dark">CV Builder</h1>
                </div>
                <div>
                  <Button 
                    variant="outline" 
                    onClick={handlePreview}
                    className="mr-2"
                  >
                    <Eye className="mr-1 h-4 w-4" /> Preview
                  </Button>
                  <Button variant="outline" onClick={() => toast({
                    title: "Help",
                    description: "Help documentation will be available soon",
                  })}>
                    <HelpCircle className="mr-1 h-4 w-4" /> Help
                  </Button>
                </div>
              </div>
            </div>
          </header>
          
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <Progress value={progressMap[activeTab]} className="h-2.5" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Personal Info</span>
                <span>Experience</span>
                <span>Education</span>
                <span>Additional Info</span>
              </div>
            </div>
          </div>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FormProvider {...form}>
              <form onSubmit={handleSubmit}>
                  <Tabs 
                    value={activeTab} 
                    onValueChange={(value) => setActiveTab(value as CVTabs)}
                    className="space-y-8"
                  >
                    <TabsList className="hidden">
                      <TabsTrigger value={CVTabs.PERSONAL}>Personal</TabsTrigger>
                      <TabsTrigger value={CVTabs.EXPERIENCE}>Experience</TabsTrigger>
                      <TabsTrigger value={CVTabs.EDUCATION}>Education</TabsTrigger>
                      <TabsTrigger value={CVTabs.ADDITIONAL}>Additional</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={CVTabs.PERSONAL} className="space-y-8">
                      <PersonalInfoSection form={form} />
                      <SummarySection form={form} />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EXPERIENCE)}
                        >
                          Next: Experience
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.EXPERIENCE} className="space-y-8">
                      <ExperienceSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.PERSONAL)}
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EDUCATION)}
                        >
                          Next: Education
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.EDUCATION} className="space-y-8">
                      <EducationSection form={form} />
                      <CertificatesSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.EXPERIENCE)}
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.ADDITIONAL)}
                        >
                          Next: Additional Info
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.ADDITIONAL} className="space-y-8">
                      <AdditionalInfoSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.EDUCATION)}
                        >
                          Back
                        </Button>
                        <div>
                          <Button 
                            type="button" 
                            variant="outline"
                            className="mr-3"
                            onClick={handlePreview}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Preview CV
                          </Button>
                          <Button 
                            type="submit"
                          >
                            <FileText className="mr-2 h-4 w-4" /> Generate PDF
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-8 flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={saveAsDraft}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? "Saving..." : "Save as Draft"}
                    </Button>
                  </div>
              </form>
            </FormProvider>
          </main>
        </>
      )}
    </div>
  );
};

export default CVBuilder;
