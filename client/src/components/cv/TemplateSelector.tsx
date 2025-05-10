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
  // Define available templates
  const templates = [
    {
      id: 'professional' as TemplateType,
      name: 'Professional',
      description: 'Classic professional design with elegant typography and consistent spacing'
    },
    {
      id: 'modern' as TemplateType,
      name: 'Modern',
      description: 'Contemporary design with bold typography and striking visual elements'
    },
    {
      id: 'minimal' as TemplateType,
      name: 'Minimal',
      description: 'Clean, minimalist design with ample whitespace and centered typography'
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
    <Card className="qwalify-card shadow-sm bg-white">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-secondary mb-6">Choose Your Template</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`
                qwalify-card-choice p-4 cursor-pointer transition-all relative overflow-hidden
                ${selectedTemplate === template.id
                  ? 'border-primary border-4 shadow-xl bg-primary/10'
                  : 'border-gray-200 hover:border-primary'
                }
              `}
              onClick={() => handleTemplateSelect(template.id)}
            >
              {selectedTemplate === template.id && (
                <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-sm font-bold rounded-bl shadow-md">
                  SELECTED
                </div>
              )}
              <div className="h-36 mb-4 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                <div className={`w-24 h-28 border ${selectedTemplate === template.id ? 'border-primary' : 'border-gray-300'} rounded relative overflow-hidden`}>
                  {/* Professional template preview */}
                  {template.id === 'professional' && (
                    <>
                      {/* Header/Name area */}
                      <div className="absolute top-1 left-2 right-2 h-3 bg-secondary rounded"></div>
                      
                      {/* Section title with separator line */}
                      <div className="absolute top-6 left-2 w-12 h-1.5 bg-secondary rounded"></div>
                      <div className="absolute top-8 left-2 w-8 h-0.5 bg-primary rounded"></div>
                      
                      {/* Content section 1 */}
                      <div className="absolute top-10 left-2 right-2 h-1 bg-gray-600 rounded"></div>
                      <div className="absolute top-12 left-2 right-4 h-1 bg-gray-500 rounded"></div>
                      <div className="absolute top-14 left-2 right-6 h-1 bg-gray-500 rounded"></div>
                      
                      {/* Section title with separator line */}
                      <div className="absolute top-17 left-2 w-10 h-1.5 bg-secondary rounded"></div>
                      <div className="absolute top-19 left-2 w-6 h-0.5 bg-primary rounded"></div>
                      
                      {/* Content section 2 */}
                      <div className="absolute top-21 left-2 w-8 h-1 bg-gray-600 rounded"></div>
                      <div className="absolute top-21 left-11 right-2 h-0.5 bg-gray-400 rounded"></div>
                    </>
                  )}
                  
                  {/* Modern template preview */}
                  {template.id === 'modern' && (
                    <>
                      {/* Header/Name area with accent color */}
                      <div className="absolute top-1 left-0 right-0 h-5 bg-primary rounded-t"></div>
                      <div className="absolute top-2 left-2 w-10 h-1.5 bg-white rounded opacity-80"></div>
                      
                      {/* Section title with highlight */}
                      <div className="absolute top-7 left-2 w-1 h-3 bg-primary rounded-sm"></div>
                      <div className="absolute top-7 left-4 w-8 h-1.5 bg-secondary rounded"></div>
                      
                      {/* Content section with timeline */}
                      <div className="absolute top-10 left-3 h-10 w-0.5 bg-primary/30"></div>
                      <div className="absolute top-10 left-3 w-1.5 h-1.5 bg-primary rounded-full"></div>
                      <div className="absolute top-10 left-6 right-2 h-1 bg-secondary rounded"></div>
                      <div className="absolute top-12 left-6 right-4 h-0.5 bg-gray-400 rounded-full"></div>
                      
                      {/* Bullet points */}
                      <div className="absolute top-17 left-6 w-0.5 h-0.5 bg-primary rounded-full"></div>
                      <div className="absolute top-17 left-8 w-6 h-0.5 bg-gray-500 rounded"></div>
                      <div className="absolute top-19 left-6 w-0.5 h-0.5 bg-primary rounded-full"></div>
                      <div className="absolute top-19 left-8 w-8 h-0.5 bg-gray-500 rounded"></div>
                    </>
                  )}
                  
                  {/* Minimal template preview */}
                  {template.id === 'minimal' && (
                    <>
                      {/* Centered header */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-secondary rounded"></div>
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-400 rounded"></div>
                      
                      {/* Centered section title */}
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary/80 rounded"></div>
                      
                      {/* Centered content */}
                      <div className="absolute top-11 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gray-400 rounded"></div>
                      <div className="absolute top-13 left-1/2 -translate-x-1/2 w-14 h-0.5 bg-gray-400 rounded"></div>
                      <div className="absolute top-15 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-400 rounded"></div>
                      
                      {/* Centered section title */}
                      <div className="absolute top-18 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary/80 rounded"></div>
                      
                      {/* Skill pills */}
                      <div className="absolute top-21 left-1/2 -translate-x-1/2 flex space-x-1">
                        <div className="w-2 h-1 bg-primary/10 border border-primary/30 rounded-full"></div>
                        <div className="w-3 h-1 bg-primary/10 border border-primary/30 rounded-full"></div>
                        <div className="w-2 h-1 bg-primary/10 border border-primary/30 rounded-full"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-secondary">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <Switch
              id="photo-toggle"
              checked={includePhoto}
              onCheckedChange={handlePhotoToggle}
              className="data-[state=checked]:bg-primary"
            />
            <Label htmlFor="photo-toggle" className="cursor-pointer font-medium text-secondary">
              Include photo in CV
            </Label>
          </div>
          <p className="text-sm text-gray-500 mt-2 ml-11">
            Adding a professional photo is optional and depends on regional standards
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;