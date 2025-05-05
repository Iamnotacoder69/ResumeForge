import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Import from shared types instead of declaring here
import { TemplateType } from "@shared/types";

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  includePhoto: boolean;
  onTemplateChange: (template: TemplateType) => void;
  onPhotoInclusionChange: (include: boolean) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  includePhoto,
  onTemplateChange,
  onPhotoInclusionChange
}) => {
  const templates: { id: TemplateType; name: string; description: string }[] = [
    {
      id: 'word-classic',
      name: 'Word Classic',
      description: 'Traditional Microsoft Word document format with standard layout'
    },
    {
      id: 'word-modern',
      name: 'Word Modern',
      description: 'Contemporary Microsoft Word template with modern styling'
    }
  ];

  const handleTemplateSelect = (template: TemplateType) => {
    onTemplateChange(template);
    console.log("Template selected:", template);
  };

  const handlePhotoToggle = () => {
    onPhotoInclusionChange(!includePhoto);
    console.log("Photo inclusion toggled:", !includePhoto);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Choose a Template</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`
                border rounded-md p-4 cursor-pointer transition-all
                ${selectedTemplate === template.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }
              `}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="h-32 mb-3 bg-gray-100 rounded flex items-center justify-center">
                <div className={`w-20 h-24 border ${selectedTemplate === template.id ? 'border-primary' : 'border-gray-300'} rounded relative overflow-hidden`}>
                  {/* Template-specific preview */}
                  {template.id === 'word-classic' && (
                    <>
                      {/* MS Word classic look with blue header */}
                      <div className="absolute top-0 left-0 w-full h-4 bg-blue-600"></div>
                      <div className="absolute top-5 left-2 right-2 h-2.5 bg-gray-700 rounded"></div>
                      <div className="absolute top-9 left-2 right-8 h-1 bg-gray-400 rounded"></div>
                      <div className="absolute top-11 left-2 right-10 h-1 bg-gray-400 rounded"></div>
                      
                      {/* Word-style section headings */}
                      <div className="absolute top-14 left-2 right-2 h-1.5 bg-blue-600 rounded"></div>
                      <div className="absolute top-17 left-2 right-8 h-1 bg-gray-400 rounded"></div>
                      <div className="absolute top-19 left-2 right-5 h-1 bg-gray-400 rounded"></div>
                      <div className="absolute top-21 left-2 right-6 h-1 bg-gray-400 rounded"></div>
                    </>
                  )}
                  
                  {template.id === 'word-modern' && (
                    <>
                      {/* MS Word modern style with sidebar */}
                      <div className="absolute top-0 left-0 w-7 h-24 bg-gray-200"></div>
                      <div className="absolute top-2 left-8 right-2 h-2.5 bg-gray-700 rounded"></div>
                      <div className="absolute top-6 left-8 right-2 h-1.5 bg-gray-500 rounded"></div>
                      
                      {/* Word modern style elements */}
                      <div className="absolute top-10 left-8 right-2 h-1.5 bg-blue-500 rounded"></div>
                      <div className="absolute top-13 left-8 right-5 h-1 bg-gray-400 rounded"></div>
                      <div className="absolute top-15 left-8 right-7 h-1 bg-gray-400 rounded"></div>
                      <div className="absolute top-18 left-8 right-2 h-1.5 bg-blue-500 rounded"></div>
                      <div className="absolute top-21 left-8 right-8 h-1 bg-gray-400 rounded"></div>
                      
                      {/* Sidebar content */}
                      <div className="absolute top-4 left-1.5 w-4 h-4 rounded-full border border-gray-400"></div>
                      <div className="absolute top-10 left-1 w-5 h-0.5 bg-gray-400 rounded"></div>
                      <div className="absolute top-12 left-1 w-5 h-0.5 bg-gray-400 rounded"></div>
                      <div className="absolute top-14 left-1 w-5 h-0.5 bg-gray-400 rounded"></div>
                    </>
                  )}
                </div>
              </div>
              <h3 className="font-medium text-gray-900">{template.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="photo-toggle"
              checked={includePhoto}
              onCheckedChange={handlePhotoToggle}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="photo-toggle" className="cursor-pointer">
              Include photo in CV
            </Label>
          </div>
          <p className="text-xs text-gray-500 mt-1 ml-10">
            Adding a photo is optional and depends on the region and industry standards
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;