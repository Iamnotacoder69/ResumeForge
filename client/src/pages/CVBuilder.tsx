import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Eye, HelpCircle, Palette } from "lucide-react";
import PersonalInfoSection from "@/components/cv/PersonalInfoSection";
import SummarySection from "@/components/cv/SummarySection";
import ExperienceSection from "@/components/cv/ExperienceSection";
import EducationSection from "@/components/cv/EducationSection";
import CertificatesSection from "@/components/cv/CertificatesSection";
import AdditionalInfoSection from "@/components/cv/AdditionalInfoSection";
import KeyCompetenciesSection from "@/components/cv/KeyCompetenciesSection";
import ExtracurricularSection from "@/components/cv/ExtracurricularSection";
import SectionOrdering from "@/components/cv/SectionOrdering";
import TemplateSelector from "@/components/cv/TemplateSelector";
import PDFPreview from "@/components/cv/PDFPreview";
import { useCVForm } from "@/lib/hooks/use-cv-form";
import { FormProvider } from "react-hook-form";
import { TemplateType } from '@shared/types';

enum CVTabs {
  TEMPLATE = "template",
  PERSONAL = "personal",
  EXPERIENCE = "experience",
  EDUCATION = "education",
  COMPETENCIES = "competencies",
  EXTRACURRICULAR = "extracurricular",
  ADDITIONAL = "additional",
  LAYOUT = "layout",
}

const CVBuilder = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<CVTabs>(CVTabs.TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const form = useCVForm();
  
  const progressMap = {
    [CVTabs.TEMPLATE]: 10,
    [CVTabs.PERSONAL]: 25,
    [CVTabs.EXPERIENCE]: 40,
    [CVTabs.EDUCATION]: 55,
    [CVTabs.COMPETENCIES]: 70,
    [CVTabs.EXTRACURRICULAR]: 85,
    [CVTabs.ADDITIONAL]: 92,
    [CVTabs.LAYOUT]: 100,
  };

  // Handle template changes
  const handleTemplateChange = (template: TemplateType) => {
    form.setValue('preferences.templateType', template);
  };

  // Handle photo inclusion
  const handlePhotoChange = (includePhoto: boolean) => {
    form.setValue('preferences.includePhoto', includePhoto);
  };

  // Handle section ordering changes
  const handleSectionOrderChange = (newOrder: string[]) => {
    form.setValue('preferences.sectionOrder.sectionIds', newOrder);
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await apiRequest("/api/generate-pdf", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response || !response.ok) {
          throw new Error("Failed to generate PDF");
        }
        
        return await response.blob();
      } catch (error) {
        console.error("PDF generation error:", error);
        throw error;
      }
    },
    onSuccess: (blob) => {
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a download link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form.getValues().personal.firstName || 'CV'}_${form.getValues().personal.lastName || 'Document'}.pdf`;
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
      console.error("PDF mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await apiRequest("/api/cv", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response) {
          throw new Error("Failed to save CV");
        }
        
        return response;
      } catch (error) {
        console.error("CV save error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your CV has been saved",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("CV save mutation error:", error);
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
    saveMutation.mutate(form.getValues());
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
  
  // Initialize default values for new fields if they don't exist
  if (!form.getValues('preferences.templateType')) {
    form.setValue('preferences.templateType', 'professional');
  }
  
  if (typeof form.getValues('preferences.includePhoto') !== 'boolean') {
    form.setValue('preferences.includePhoto', false);
  }
  
  if (!form.getValues('preferences.sectionOrder.sectionIds')) {
    form.setValue('preferences.sectionOrder.sectionIds', [
      'experience', 'education', 'competencies', 'certificates', 'extracurricular'
    ]);
  }
  
  if (!form.getValues('competencies.technicalSkills')) {
    form.setValue('competencies.technicalSkills', []);
  }

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
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center">
                  <FileText className="text-primary text-2xl mr-3" />
                  <h1 className="text-2xl font-bold text-neutral-dark">CV Builder</h1>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handlePreview}
                    className="text-xs sm:text-sm"
                  >
                    <Eye className="mr-1 h-4 w-4" /> Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast({
                      title: "Help",
                      description: "Help documentation will be available soon",
                    })}
                    className="text-xs sm:text-sm"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" /> Help
                  </Button>
                </div>
              </div>
            </div>
          </header>
          
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <Progress value={progressMap[activeTab]} className="h-2.5" />
              <div className="hidden sm:flex justify-between text-xs text-gray-500 mt-1">
                <span>Template</span>
                <span>Personal Info</span>
                <span>Experience</span>
                <span>Education</span>
                <span>Competencies</span>
                <span>Activities</span>
                <span>Add. Info</span>
                <span>Layout</span>
              </div>
            </div>
          </div>
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            <FormProvider {...form}>
              <form onSubmit={handleSubmit}>
                  <Tabs 
                    value={activeTab} 
                    onValueChange={(value) => setActiveTab(value as CVTabs)}
                    className="space-y-4 sm:space-y-8"
                  >
                    <TabsList className="hidden">
                      <TabsTrigger value={CVTabs.TEMPLATE}>Template</TabsTrigger>
                      <TabsTrigger value={CVTabs.PERSONAL}>Personal</TabsTrigger>
                      <TabsTrigger value={CVTabs.EXPERIENCE}>Experience</TabsTrigger>
                      <TabsTrigger value={CVTabs.EDUCATION}>Education</TabsTrigger>
                      <TabsTrigger value={CVTabs.COMPETENCIES}>Competencies</TabsTrigger>
                      <TabsTrigger value={CVTabs.EXTRACURRICULAR}>Extracurricular</TabsTrigger>
                      <TabsTrigger value={CVTabs.ADDITIONAL}>Additional</TabsTrigger>
                      <TabsTrigger value={CVTabs.LAYOUT}>Layout</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={CVTabs.TEMPLATE} className="space-y-8">
                      <TemplateSelector 
                        selectedTemplate={form.getValues('preferences.templateType') || 'professional'} 
                        includePhoto={form.getValues('preferences.includePhoto') || false}
                        onTemplateChange={handleTemplateChange}
                        onPhotoChange={handlePhotoChange}
                      />
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.PERSONAL)}
                        >
                          Next: Personal Information
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.PERSONAL} className="space-y-8">
                      <PersonalInfoSection form={form} />
                      <SummarySection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.TEMPLATE)}
                        >
                          Back
                        </Button>
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
                          onClick={() => setActiveTab(CVTabs.COMPETENCIES)}
                        >
                          Next: Key Competencies
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.COMPETENCIES} className="space-y-8">
                      <KeyCompetenciesSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.EDUCATION)}
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EXTRACURRICULAR)}
                        >
                          Next: Extracurricular Activities
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.EXTRACURRICULAR} className="space-y-8">
                      <ExtracurricularSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.COMPETENCIES)}
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
                          onClick={() => setActiveTab(CVTabs.EXTRACURRICULAR)}
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.LAYOUT)}
                        >
                          Next: Layout & Ordering
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value={CVTabs.LAYOUT} className="space-y-8">
                      <SectionOrdering 
                        sectionOrder={form.getValues('preferences.sectionOrder.sectionIds') || [
                          'experience', 'education', 'competencies', 'certificates', 'extracurricular'
                        ]} 
                        onChange={handleSectionOrderChange}
                      />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.ADDITIONAL)}
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
