import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Users, 
  Check, 
  FileImage 
} from "lucide-react";
import { TemplateType } from '@shared/types';

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  includePhoto: boolean;
  onTemplateChange: (template: TemplateType) => void;
  onPhotoChange: (includePhoto: boolean) => void;
}

interface TemplateCard {
  value: TemplateType;
  title: string;
  description: string;
  photoSupported: boolean;
}

const templates: TemplateCard[] = [
  {
    value: 'professional',
    title: 'Professional',
    description: 'Clean and modern design for corporate environments',
    photoSupported: true
  },
  {
    value: 'minimalist',
    title: 'Minimalist',
    description: 'Simple and elegant with focus on content',
    photoSupported: false
  },
  {
    value: 'creative',
    title: 'Creative',
    description: 'Colorful and expressive for creative fields',
    photoSupported: true
  },
  {
    value: 'academic',
    title: 'Academic',
    description: 'Traditional format for academic and research positions',
    photoSupported: true
  },
  {
    value: 'modern',
    title: 'Modern',
    description: 'Contemporary design with a balanced layout',
    photoSupported: true
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  includePhoto,
  onTemplateChange,
  onPhotoChange
}) => {
  const currentTemplate = templates.find(t => t.value === selectedTemplate) || templates[0];
  
  return (
    <Card className="mb-8 shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Choose CV Template</h2>
        
        <RadioGroup 
          value={selectedTemplate} 
          onValueChange={(value) => onTemplateChange(value as TemplateType)} 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {templates.map((template) => (
            <div key={template.value} className="relative">
              <RadioGroupItem
                value={template.value}
                id={`template-${template.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`template-${template.value}`}
                className="flex flex-col h-full items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="w-full text-center mb-3">
                  <div className="mb-2 font-semibold">{template.title}</div>
                  <div className="text-sm text-muted-foreground">{template.description}</div>
                </div>
                
                <div className="w-full border rounded-md p-2 bg-muted/30">
                  <div className="flex justify-between items-center mb-3">
                    <div className="w-20 h-4 bg-primary/20 rounded-md"></div>
                    {template.photoSupported && (
                      <div className="w-8 h-8 rounded-full bg-muted"></div>
                    )}
                  </div>
                  <div className="flex gap-1 mb-2">
                    <div className="w-1/2 h-2 bg-muted rounded-md"></div>
                    <div className="w-1/2 h-2 bg-muted rounded-md"></div>
                  </div>
                  <div className="w-full h-4 bg-muted rounded-md mb-2"></div>
                  <div className="grid grid-cols-2 gap-1 mb-1">
                    <div className="h-2 bg-muted rounded-md"></div>
                    <div className="h-2 bg-muted rounded-md"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-2 bg-muted rounded-md"></div>
                    <div className="h-2 bg-muted rounded-md"></div>
                  </div>
                </div>
                
                {selectedTemplate === template.value && (
                  <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {currentTemplate.photoSupported && (
          <div className="mt-6 flex items-center space-x-2">
            <Switch 
              id="include-photo" 
              checked={includePhoto} 
              onCheckedChange={onPhotoChange} 
            />
            <Label htmlFor="include-photo" className="flex items-center cursor-pointer">
              <FileImage className="mr-2 h-4 w-4" />
              Include Photo
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;