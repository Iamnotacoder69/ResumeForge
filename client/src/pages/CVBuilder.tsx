import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Eye, HelpCircle, Check, ArrowRight, ArrowLeft } from "lucide-react";
import PersonalInfoSection from "@/components/cv/PersonalInfoSection";
import SummarySection from "@/components/cv/SummarySection";
import KeyCompetenciesSection from "@/components/cv/KeyCompetenciesSection";
import ExperienceSection from "@/components/cv/ExperienceSection";
import EducationSection from "@/components/cv/EducationSection";
import CertificatesSection from "@/components/cv/CertificatesSection";
import ExtracurricularSection from "@/components/cv/ExtracurricularSection"; 
import AdditionalInfoSection from "@/components/cv/AdditionalInfoSection";
import SectionOrderer from "@/components/cv/SectionOrderer";
import TemplateSelector from "@/components/cv/TemplateSelector";
import PDFPreview from "@/components/cv/PDFPreview";
import { useCVForm } from "@/lib/hooks/use-cv-form";
import { FormProvider } from "react-hook-form";
import { SectionOrder, TemplateType } from "@shared/types";

enum CVTabs {
  TEMPLATE = "template",
  PERSONAL = "personal",
  SUMMARY = "summary",
  KEY_COMPETENCIES = "keyCompetencies",
  EXPERIENCE = "experience",
  EDUCATION = "education",
  EXTRACURRICULAR = "extracurricular",
  ADDITIONAL = "additional",
  REORDER = "reorder",
}

const CVBuilder = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<CVTabs>(CVTabs.TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if there's extracted CV data from the upload process
  const extractedCVDataFromStorage = (() => {
    try {
      const dataString = sessionStorage.getItem('extractedCVData');
      if (dataString) {
        const parsedData = JSON.parse(dataString);
        console.log('Loaded CV data from storage:', parsedData);
        
        // Check if the data is wrapped in a 'data' property
        if (parsedData && typeof parsedData === 'object') {
          // Return either the inner data object or the parsedData itself
          return parsedData.data || parsedData;
        }
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('Error parsing extracted CV data:', error);
      return null;
    }
  })();
  
  // Initialize the form with the extracted data if available
  const form = useCVForm(extractedCVDataFromStorage);
  
  // Use a ref to prevent multiple loads of the same data
  const dataLoadedRef = React.useRef(false);
  
  // Show a toast notification if we have extracted data
  useEffect(() => {
    // Only load data once
    if (extractedCVDataFromStorage && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      setIsLoading(false);
      toast({
        title: "CV Data Loaded",
        description: "Your CV data has been loaded. You can now edit and enhance it.",
        variant: "default"
      });
      
      // Clear the storage to prevent reloads on page refresh
      // This way we keep the data in the form but don't reprocess it
      sessionStorage.removeItem('extractedCVData');
    } else {
      setIsLoading(false);
    }
  }, [extractedCVDataFromStorage, toast]);
  
  // Default section order (matching the one in use-cv-form.ts)
  const defaultSectionOrder: SectionOrder[] = [
    { id: 'summary', name: 'Professional Summary', visible: true, order: 0 },
    { id: 'keyCompetencies', name: 'Key Competencies', visible: true, order: 1 },
    { id: 'experience', name: 'Work Experience', visible: true, order: 2 },
    { id: 'education', name: 'Education', visible: true, order: 3 },
    { id: 'certificates', name: 'Certificates', visible: true, order: 4 },
    { id: 'extracurricular', name: 'Extracurricular Activities', visible: true, order: 5 },
    { id: 'additional', name: 'Additional Information', visible: true, order: 6 },
  ];
  
  // Template selection state
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('professional');
  const [includePhoto, setIncludePhoto] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<SectionOrder[]>(
    form.getValues().templateSettings?.sectionOrder || defaultSectionOrder
  );
  
  // Update form when template settings change
  useEffect(() => {
    form.setValue('templateSettings.template', selectedTemplate);
    form.setValue('templateSettings.includePhoto', includePhoto);
  }, [selectedTemplate, includePhoto, form]);
  
  // Update form when section order changes
  useEffect(() => {
    form.setValue('templateSettings.sectionOrder', sectionOrder);
  }, [sectionOrder, form]);
  
  // Progress map for progress bar
  const progressMap = {
    [CVTabs.TEMPLATE]: 10,
    [CVTabs.PERSONAL]: 20,
    [CVTabs.SUMMARY]: 30,
    [CVTabs.KEY_COMPETENCIES]: 40,
    [CVTabs.EXPERIENCE]: 50,
    [CVTabs.EDUCATION]: 60,
    [CVTabs.EXTRACURRICULAR]: 70,
    [CVTabs.ADDITIONAL]: 80,
    [CVTabs.REORDER]: 100,
  };
  
  // Handle template selection
  const handleTemplateChange = (template: TemplateType) => {
    setSelectedTemplate(template);
  };
  
  // Handle photo inclusion toggling
  const handlePhotoInclusionChange = (include: boolean) => {
    setIncludePhoto(include);
  };
  
  // Handle section reordering
  const handleSectionReorder = (updatedSections: SectionOrder[]) => {
    setSectionOrder(updatedSections);
  };
  
  // Handle section visibility toggling
  const handleSectionVisibilityToggle = (sectionId: string, visible: boolean) => {
    setSectionOrder(prevSections => 
      prevSections.map(section => 
        section.id === sectionId ? { ...section, visible } : section
      )
    );
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submit mutation: Starting PDF generation");
      try {
        // Make sure templateSettings is properly defined
        const dataWithDefaults = {
          ...data,
          templateSettings: {
            template: selectedTemplate,
            includePhoto: includePhoto,
            sectionOrder: sectionOrder,
            ...(data.templateSettings || {})
          }
        };
        
        const response = await apiRequest("POST", "/api/generate-pdf", dataWithDefaults);
        console.log("Submit mutation: Response received", response.status);
        
        // Check response content type to ensure it's a PDF
        const contentType = response.headers.get('content-type');
        console.log("Submit mutation: Content-Type:", contentType);
        
        if (contentType && contentType.includes('application/pdf')) {
          console.log("Submit mutation: PDF content type confirmed");
          return response.blob();
        } else {
          console.warn("Submit mutation: Unexpected content type", contentType);
          // Try to get the blob anyway
          return response.blob();
        }
      } catch (error) {
        console.error("Submit mutation: Error in fetching PDF", error);
        throw error;
      }
    },
    onSuccess: (blob) => {
      console.log("Submit mutation: Success, blob size:", blob.size);
      try {
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
      } catch (downloadError) {
        console.error("Submit mutation: Error during download", downloadError);
        toast({
          title: "Error",
          description: "PDF was generated but there was an error downloading it",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Submit mutation: Error handler called", error);
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
    console.log("Submitting form data for PDF generation");
    // Ensure templateSettings has the correct properties
    const dataToSubmit = {
      ...data,
      templateSettings: {
        template: selectedTemplate,
        includePhoto: includePhoto,
        sectionOrder: sectionOrder
      }
    };
    submitMutation.mutate(dataToSubmit);
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
    // Always show preview regardless of validation state
    setShowPreview(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {showPreview ? (
        <PDFPreview 
          data={{
            ...form.getValues(),
            templateSettings: {
              template: selectedTemplate,
              includePhoto: includePhoto,
              sectionOrder: sectionOrder
            }
          }}
          onClose={() => setShowPreview(false)}
        />
      ) : (
        <>
          <header className="qwalify-header sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold flex items-center">
                    <span className="qwalify-logo">Qwalify</span>
                    <span className="text-white">CV Builder</span>
                  </h1>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={handlePreview}
                    className="text-xs sm:text-sm relative bg-primary text-white hover:bg-primary/90 hover:text-white font-bold group border-2 border-secondary"
                  >
                    <Eye className="mr-1 h-4 w-4" /> Preview CV
                    <span className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md p-2 text-xs hidden group-hover:block z-10">
                      Preview available with incomplete fields
                    </span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast({
                      title: "Help",
                      description: "Help documentation will be available soon",
                    })}
                    className="text-xs sm:text-sm bg-white/30 hover:bg-white/40 text-white border-2 border-white/50 font-semibold"
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
              <div className="flex justify-between text-xs text-gray-500 mt-1 flex-wrap">
                <span>Template</span>
                <span>Personal</span>
                <span className="hidden sm:inline">Summary</span>
                <span className="hidden md:inline">Key Skills</span>
                <span>Experience</span>
                <span>Education</span>
                <span className="hidden md:inline">Extracurricular</span>
                <span>Additional</span>
                <span>Organize</span>
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
                      <TabsTrigger value={CVTabs.SUMMARY}>Summary</TabsTrigger>
                      <TabsTrigger value={CVTabs.KEY_COMPETENCIES}>Key Competencies</TabsTrigger>
                      <TabsTrigger value={CVTabs.EXPERIENCE}>Experience</TabsTrigger>
                      <TabsTrigger value={CVTabs.EDUCATION}>Education</TabsTrigger>
                      <TabsTrigger value={CVTabs.EXTRACURRICULAR}>Extracurricular</TabsTrigger>
                      <TabsTrigger value={CVTabs.ADDITIONAL}>Additional</TabsTrigger>
                      <TabsTrigger value={CVTabs.REORDER}>Reorder</TabsTrigger>
                    </TabsList>
                    
                    {/* Template Selection Tab */}
                    <TabsContent value={CVTabs.TEMPLATE} className="space-y-8">
                      <TemplateSelector 
                        selectedTemplate={selectedTemplate}
                        includePhoto={includePhoto}
                        onTemplateChange={handleTemplateChange}
                        onPhotoInclusionChange={handlePhotoInclusionChange}
                      />
                      
                      <div className="flex justify-center mt-6">
                        <Button 
                          type="button"
                          className="qwalify-primary-btn px-6 py-5 text-lg font-bold shadow-lg"
                          onClick={() => {
                            console.log("Navigating to Personal Information tab");
                            setActiveTab(CVTabs.PERSONAL);
                          }}
                          disabled={!selectedTemplate}
                        >
                          Continue with {selectedTemplate ? (selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)) : ""} Template
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Personal Info Tab */}
                    <TabsContent value={CVTabs.PERSONAL} className="space-y-8">
                      <PersonalInfoSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.TEMPLATE)}
                          className="border-gray-300 hover:bg-gray-100 font-medium"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.SUMMARY)}
                          className="bg-primary text-white hover:bg-primary/90 font-semibold"
                        >
                          Next: Professional Summary <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Summary Tab */}
                    <TabsContent value={CVTabs.SUMMARY} className="space-y-8">
                      <SummarySection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.PERSONAL)}
                          className="border-gray-300 hover:bg-gray-100 font-medium"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.KEY_COMPETENCIES)}
                          className="bg-primary text-white hover:bg-primary/90 font-semibold"
                        >
                          Next: Key Competencies <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Key Competencies Tab */}
                    <TabsContent value={CVTabs.KEY_COMPETENCIES} className="space-y-8">
                      <KeyCompetenciesSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.SUMMARY)}
                          className="border-gray-300 hover:bg-gray-100 font-medium"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EXPERIENCE)}
                          className="bg-primary text-white hover:bg-primary/90 font-semibold"
                        >
                          Next: Work Experience <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Experience Tab */}
                    <TabsContent value={CVTabs.EXPERIENCE} className="space-y-8">
                      <ExperienceSection form={form} />
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.KEY_COMPETENCIES)}
                          className="border-gray-300 hover:bg-gray-100 font-medium"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EDUCATION)}
                          className="bg-primary text-white hover:bg-primary/90 font-semibold"
                        >
                          Next: Education <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Education Tab */}
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
                          onClick={() => setActiveTab(CVTabs.EXTRACURRICULAR)}
                        >
                          Next: Extracurricular Activities <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Extracurricular Tab */}
                    <TabsContent value={CVTabs.EXTRACURRICULAR} className="space-y-8">
                      <ExtracurricularSection form={form} />
                      
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
                          onClick={() => setActiveTab(CVTabs.ADDITIONAL)}
                        >
                          Next: Additional Information <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Additional Info Tab */}
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
                          onClick={() => setActiveTab(CVTabs.REORDER)}
                        >
                          Next: Organize Sections <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Reorder Sections Tab */}
                    <TabsContent value={CVTabs.REORDER} className="space-y-8">
                      <SectionOrderer 
                        sections={sectionOrder}
                        onReorder={handleSectionReorder}
                        onToggleVisibility={handleSectionVisibilityToggle}
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
                          <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="flex flex-col mb-5 sm:mb-0">
                              <Button 
                                type="button" 
                                variant="outline"
                                className="relative"
                                onClick={handlePreview}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Preview CV
                                <span className="absolute bottom-0 left-0 right-0 -mb-5 text-xs text-gray-500">
                                  Preview available with incomplete fields
                                </span>
                              </Button>
                            </div>
                            <Button 
                              type="button"
                              onClick={() => {
                                const dataWithTemplateSettings = {
                                  ...form.getValues(),
                                  templateSettings: {
                                    template: selectedTemplate,
                                    includePhoto: includePhoto,
                                    sectionOrder: sectionOrder
                                  }
                                };
                                submitMutation.mutate(dataWithTemplateSettings);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" /> Generate PDF
                            </Button>
                          </div>
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
