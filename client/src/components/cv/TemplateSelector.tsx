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
    <Card className="shadow-lg border-0 rounded-xl overflow-hidden">
      <CardContent className="pt-6 sm:pt-8 px-6 sm:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Choose Your Template</h2>
        <p className="text-gray-500 mb-6">Select the design that best represents your professional style</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`
                border-2 rounded-xl p-5 cursor-pointer transition-all duration-300
                ${selectedTemplate === template.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-gray-100 hover:border-primary/30 hover:shadow-md hover:bg-gray-50'
                }
              `}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="h-40 mb-4 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                <div className={`w-24 h-32 border-2 ${selectedTemplate === template.id ? 'border-primary' : 'border-gray-200'} rounded-md relative overflow-hidden shadow-sm`}>
                  {/* Professional template preview */}
                  {template.id === 'professional' && (
                    <>
                      {/* Header/Name area */}
                      <div className="absolute top-1 left-2 right-2 h-3 bg-slate-800 rounded"></div>
                      
                      {/* Section title with separator line */}
                      <div className="absolute top-6 left-2 w-12 h-1.5 bg-slate-700 rounded"></div>
                      <div className="absolute top-8 left-2 w-8 h-0.5 bg-amber-500 rounded"></div>
                      
                      {/* Content section 1 */}
                      <div className="absolute top-10 left-2 right-2 h-1 bg-gray-600 rounded"></div>
                      <div className="absolute top-12 left-2 right-4 h-1 bg-gray-500 rounded"></div>
                      <div className="absolute top-14 left-2 right-6 h-1 bg-gray-500 rounded"></div>
                      
                      {/* Section title with separator line */}
                      <div className="absolute top-17 left-2 w-10 h-1.5 bg-slate-700 rounded"></div>
                      <div className="absolute top-19 left-2 w-6 h-0.5 bg-amber-500 rounded"></div>
                      
                      {/* Content section 2 */}
                      <div className="absolute top-21 left-2 w-8 h-1 bg-gray-600 rounded"></div>
                      <div className="absolute top-21 left-11 right-2 h-0.5 bg-gray-400 rounded"></div>
                    </>
                  )}
                  
                  {/* Modern template preview */}
                  {template.id === 'modern' && (
                    <>
                      {/* Header/Name area with accent color */}
                      <div className="absolute top-1 left-0 right-0 h-5 bg-blue-600 rounded-t"></div>
                      <div className="absolute top-2 left-2 w-10 h-1.5 bg-white rounded opacity-80"></div>
                      
                      {/* Section title with highlight */}
                      <div className="absolute top-7 left-2 w-1 h-3 bg-blue-500 rounded-sm"></div>
                      <div className="absolute top-7 left-4 w-8 h-1.5 bg-slate-700 rounded"></div>
                      
                      {/* Content section with timeline */}
                      <div className="absolute top-10 left-3 h-10 w-0.5 bg-blue-200"></div>
                      <div className="absolute top-10 left-3 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <div className="absolute top-10 left-6 right-2 h-1 bg-slate-700 rounded"></div>
                      <div className="absolute top-12 left-6 right-4 h-0.5 bg-gray-400 rounded-full"></div>
                      
                      {/* Bullet points */}
                      <div className="absolute top-17 left-6 w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
                      <div className="absolute top-17 left-8 w-6 h-0.5 bg-gray-500 rounded"></div>
                      <div className="absolute top-19 left-6 w-0.5 h-0.5 bg-blue-500 rounded-full"></div>
                      <div className="absolute top-19 left-8 w-8 h-0.5 bg-gray-500 rounded"></div>
                    </>
                  )}
                  
                  {/* Minimal template preview */}
                  {template.id === 'minimal' && (
                    <>
                      {/* Centered header */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-800 rounded"></div>
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gray-400 rounded"></div>
                      
                      {/* Centered section title */}
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-500 rounded"></div>
                      
                      {/* Centered content */}
                      <div className="absolute top-11 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gray-400 rounded"></div>
                      <div className="absolute top-13 left-1/2 -translate-x-1/2 w-14 h-0.5 bg-gray-400 rounded"></div>
                      <div className="absolute top-15 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gray-400 rounded"></div>
                      
                      {/* Centered section title */}
                      <div className="absolute top-18 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-500 rounded"></div>
                      
                      {/* Skill pills */}
                      <div className="absolute top-21 left-1/2 -translate-x-1/2 flex space-x-1">
                        <div className="w-2 h-1 bg-gray-200 border border-gray-300 rounded-full"></div>
                        <div className="w-3 h-1 bg-gray-200 border border-gray-300 rounded-full"></div>
                        <div className="w-2 h-1 bg-gray-200 border border-gray-300 rounded-full"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
                {selectedTemplate === template.id && (
                  <div className="bg-primary/10 rounded-full p-1 mt-1">
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="bg-primary/5 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Switch
                  id="photo-toggle"
                  checked={includePhoto}
                  onCheckedChange={handlePhotoToggle}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="photo-toggle" className="font-medium cursor-pointer text-gray-900">
                  Include photo in CV
                </Label>
              </div>
              <p className="text-sm text-gray-500 mt-1 ml-10 sm:ml-11">
                Adding a photo is optional and depends on region and industry standards
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <div className={`w-12 h-12 rounded-full border-2 ${includePhoto ? 'border-primary bg-primary/10' : 'border-gray-200 bg-gray-50'} flex items-center justify-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-6 ${includePhoto ? 'text-primary' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;