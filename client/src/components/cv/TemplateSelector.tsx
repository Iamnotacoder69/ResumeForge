import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export type TemplateType = 'minimalist' | 'professional' | 'creative' | 'academic';

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
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Clean and simple design with essential information only'
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Traditional business style with a formal structure'
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Modern design with colorful accents for creative fields'
    },
    {
      id: 'academic',
      name: 'Academic',
      description: 'Detailed format for academic and research positions'
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
                <div className={`w-20 h-24 border ${selectedTemplate === template.id ? 'border-primary' : 'border-gray-300'} rounded relative`}>
                  {/* Template preview thumbnail */}
                  <div className="absolute top-2 left-2 right-2 h-3 bg-gray-300 rounded"></div>
                  <div className="absolute top-7 left-2 w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="absolute top-7 right-2 w-6 h-3 bg-gray-300 rounded"></div>
                  <div className="absolute top-12 left-2 right-2 h-2 bg-gray-300 rounded"></div>
                  <div className="absolute top-16 left-2 right-2 h-2 bg-gray-300 rounded"></div>
                  <div className="absolute top-20 left-2 right-2 h-2 bg-gray-300 rounded"></div>
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