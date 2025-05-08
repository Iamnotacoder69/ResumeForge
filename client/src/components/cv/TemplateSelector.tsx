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
      id: 'precision',
      name: 'Precision',
      description: 'A modern CV with fixed grid layout and consistent spacing regardless of content length'
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
                  {/* Precision template preview */}
                  {template.id === 'precision' && (
                    <>
                      {/* Header/Name area with blue accent */}
                      <div className="absolute top-1 left-2 right-2 h-3 bg-blue-800 rounded"></div>
                      
                      {/* Section titles with blue underlines */}
                      <div className="absolute top-5 left-2 w-8 h-1.5 bg-slate-700 rounded"></div>
                      <div className="absolute top-6.5 left-2 right-2 h-0.5 bg-blue-500 rounded"></div>
                      
                      {/* Fixed section blocks showing grid structure */}
                      <div className="absolute top-8 left-2 right-2 h-2 bg-gray-100 rounded"></div>
                      
                      <div className="absolute top-11 left-2 w-8 h-1.5 bg-slate-700 rounded"></div>
                      <div className="absolute top-12.5 left-2 right-2 h-0.5 bg-blue-500 rounded"></div>
                      <div className="absolute top-14 left-2 right-2 h-2 bg-gray-100 rounded"></div>
                      
                      <div className="absolute top-17 left-2 w-8 h-1.5 bg-slate-700 rounded"></div>
                      <div className="absolute top-18.5 left-2 right-2 h-0.5 bg-blue-500 rounded"></div>
                      <div className="absolute top-20 left-2 right-2 h-2 bg-gray-100 rounded"></div>
                      
                      {/* Grid structure lines */}
                      <div className="absolute top-0 left-0 right-0 bottom-0 border-l border-r border-blue-100 opacity-30 pointer-events-none"></div>
                      <div className="absolute top-11 left-0 right-0 border-t border-blue-100 opacity-30 pointer-events-none"></div>
                      <div className="absolute top-17 left-0 right-0 border-t border-blue-100 opacity-30 pointer-events-none"></div>
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