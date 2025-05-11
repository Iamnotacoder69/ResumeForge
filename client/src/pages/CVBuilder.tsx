import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Eye, HelpCircle, Check } from "lucide-react";
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
import SectionVisibilityToggle from "@/components/cv/SectionVisibilityToggle";
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
  
  // Function to directly trigger browser print dialog
  const handleDirectPrint = () => {
    // First show the preview
    setShowPreview(true);
    
    // Then trigger the print dialog with a slight delay to ensure the preview loads
    setTimeout(() => {
      // Define a filename for the PDF
      const firstName = form.getValues().personal?.firstName || '';
      const lastName = form.getValues().personal?.lastName || '';
      const pdfFileName = `${firstName}_${lastName}_CV`.replace(/\s+/g, '_');
      
      // Create a print-friendly stylesheet
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          /* Hide everything except the CV template */
          body * {
            visibility: hidden;
          }
          .cv-template-wrapper, .cv-template-wrapper * {
            visibility: visible;
          }
          .cv-template-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            background-color: white !important;
          }
          
          /* Force background colors and images to print */
          .cv-template-wrapper * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Page settings for PDF output */
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          
          /* Ensure proper font rendering */
          * {
            font-family: 'Inter', 'Helvetica', sans-serif !important;
            -webkit-font-smoothing: antialiased;
          }
          
          /* Fix any text overflow issues */
          p, h1, h2, h3 {
            overflow: visible !important;
            white-space: normal !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      // Set the document title to improve the suggested filename
      const originalTitle = document.title;
      document.title = pdfFileName;
      
      // Trigger the print dialog
      window.print();
      
      // Show a success toast
      toast({
        title: "PDF Generation",
        description: "Your CV has been prepared for printing/download",
        variant: "default",
      });
      
      // Restore the original title and remove the print-specific styles
      setTimeout(() => {
        document.title = originalTitle;
        document.head.removeChild(style);
      }, 1000);
    }, 500); // Half-second delay to ensure preview is rendered
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center">
                  <FileText className="text-[#03d27c] text-2xl mr-3" />
                  <h1 className="text-2xl font-bold text-[#043e44]">CV Builder</h1>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handlePreview}
                    className="text-xs sm:text-sm relative group border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                  >
                    <Eye className="mr-1 h-4 w-4 text-[#03d27c]" /> Preview
                    <span className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md p-2 text-xs hidden group-hover:block z-10">
                      Preview available with incomplete fields
                    </span>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toast({
                      title: "Help",
                      description: "Help documentation will be available soon",
                    })}
                    className="text-xs sm:text-sm border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                  >
                    <HelpCircle className="mr-1 h-4 w-4 text-[#03d27c]" /> Help
                  </Button>
                </div>
              </div>
            </div>
          </header>
          
          <div className="bg-white border-b border-[#03d27c]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <Progress value={progressMap[activeTab]} className="h-2.5 bg-[#03d27c]/20" />
              <div className="flex justify-between text-xs text-[#043e44]/80 mt-1 flex-wrap">
                <span className={activeTab === CVTabs.TEMPLATE ? "text-[#03d27c] font-medium" : ""}>Template</span>
                <span className={activeTab === CVTabs.PERSONAL ? "text-[#03d27c] font-medium" : ""}>Personal</span>
                <span className={`hidden sm:inline ${activeTab === CVTabs.SUMMARY ? "text-[#03d27c] font-medium" : ""}`}>Summary</span>
                <span className={`hidden md:inline ${activeTab === CVTabs.KEY_COMPETENCIES ? "text-[#03d27c] font-medium" : ""}`}>Key Skills</span>
                <span className={activeTab === CVTabs.EXPERIENCE ? "text-[#03d27c] font-medium" : ""}>Experience</span>
                <span className={activeTab === CVTabs.EDUCATION ? "text-[#03d27c] font-medium" : ""}>Education</span>
                <span className={`hidden md:inline ${activeTab === CVTabs.EXTRACURRICULAR ? "text-[#03d27c] font-medium" : ""}`}>Extracurricular</span>
                <span className={activeTab === CVTabs.ADDITIONAL ? "text-[#03d27c] font-medium" : ""}>Additional</span>
                <span className={activeTab === CVTabs.REORDER ? "text-[#03d27c] font-medium" : ""}>Organize</span>
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
                      
                      <div className="flex justify-end">
                        <Button 
                          type="button" 
                          onClick={() => {
                            console.log("Navigating to Personal Information tab");
                            setActiveTab(CVTabs.PERSONAL);
                          }}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Personal Information <Check className="ml-2 h-4 w-4" />
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
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.SUMMARY)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Professional Summary <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Summary Tab */}
                    <TabsContent value={CVTabs.SUMMARY} className="space-y-8">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Professional Summary</h2>
                          <SectionVisibilityToggle 
                            sectionId="summary"
                            isVisible={sectionOrder.find(s => s.id === 'summary')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">Provide a concise professional summary highlighting your key attributes and career focus.</p>
                        <SummarySection form={form} />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.PERSONAL)}
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.KEY_COMPETENCIES)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Key Competencies <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Key Competencies Tab */}
                    <TabsContent value={CVTabs.KEY_COMPETENCIES} className="space-y-8">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Key Competencies</h2>
                          <SectionVisibilityToggle 
                            sectionId="keyCompetencies"
                            isVisible={sectionOrder.find(s => s.id === 'keyCompetencies')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">List your technical and soft skills to highlight your strengths.</p>
                        <KeyCompetenciesSection form={form} />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.SUMMARY)}
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EXPERIENCE)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Work Experience <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Experience Tab */}
                    <TabsContent value={CVTabs.EXPERIENCE} className="space-y-8">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Work Experience</h2>
                          <SectionVisibilityToggle 
                            sectionId="experience"
                            isVisible={sectionOrder.find(s => s.id === 'experience')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">Add your relevant work history with responsibilities and achievements.</p>
                        <ExperienceSection form={form} />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.KEY_COMPETENCIES)}
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EDUCATION)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Education <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Education Tab */}
                    <TabsContent value={CVTabs.EDUCATION} className="space-y-8">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Education</h2>
                          <SectionVisibilityToggle 
                            sectionId="education"
                            isVisible={sectionOrder.find(s => s.id === 'education')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">Add your educational background, including degrees and achievements.</p>
                        <EducationSection form={form} />
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Certificates</h2>
                          <SectionVisibilityToggle 
                            sectionId="certificates"
                            isVisible={sectionOrder.find(s => s.id === 'certificates')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">Add professional certifications and qualifications you've earned.</p>
                        <CertificatesSection form={form} />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.EXPERIENCE)}
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.EXTRACURRICULAR)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Extracurricular Activities <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Extracurricular Tab */}
                    <TabsContent value={CVTabs.EXTRACURRICULAR} className="space-y-8">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Extracurricular Activities</h2>
                          <SectionVisibilityToggle 
                            sectionId="extracurricular"
                            isVisible={sectionOrder.find(s => s.id === 'extracurricular')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">Add volunteer work, clubs, sports, or other activities outside of your professional experience.</p>
                        <ExtracurricularSection form={form} />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.EDUCATION)}
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.ADDITIONAL)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
                        >
                          Next: Additional Information <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                    
                    {/* Additional Info Tab */}
                    <TabsContent value={CVTabs.ADDITIONAL} className="space-y-8">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#043e44]">Additional Information</h2>
                          <SectionVisibilityToggle 
                            sectionId="additional"
                            isVisible={sectionOrder.find(s => s.id === 'additional')?.visible ?? true}
                            onToggle={handleSectionVisibilityToggle}
                          />
                        </div>
                        <p className="text-gray-500 mb-6">Add other skills, interests, or relevant information that doesn't fit in the other sections.</p>
                        <AdditionalInfoSection form={form} />
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setActiveTab(CVTabs.EXTRACURRICULAR)}
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <Button 
                          type="button" 
                          onClick={() => setActiveTab(CVTabs.REORDER)}
                          className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white"
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
                          className="border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                        >
                          Back
                        </Button>
                        <div>
                          <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="flex flex-col mb-5 sm:mb-0">
                              <Button 
                                type="button" 
                                variant="outline"
                                className="relative border-[#03d27c] text-[#043e44] hover:bg-[#03d27c]/10"
                                onClick={handlePreview}
                              >
                                <Eye className="mr-2 h-4 w-4 text-[#03d27c]" /> Preview CV
                                <span className="absolute bottom-0 left-0 right-0 -mb-5 text-xs text-[#043e44]/70">
                                  Preview available with incomplete fields
                                </span>
                              </Button>
                            </div>
                            <Button 
                              type="button"
                              className="bg-[#03d27c] hover:bg-[#03d27c]/90 text-white font-medium"
                              onClick={handleDirectPrint}
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
