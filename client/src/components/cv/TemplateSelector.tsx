import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileImage, Check } from "lucide-react";
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
  imageSrc: string;
}

// Sample template previews - these would normally be real screenshots of the templates
// Using placeholder images for now as examples
const templates: TemplateCard[] = [
  {
    value: 'professional',
    title: 'Professional',
    description: 'Clean and modern design for corporate environments',
    photoSupported: true,
    imageSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320"><rect width="240" height="320" fill="white"/><rect x="20" y="20" width="200" height="40" fill="%232563eb" rx="2"/><text x="120" y="45" font-family="Arial" font-size="16" fill="white" text-anchor="middle">Professional</text><rect x="20" y="70" width="140" height="5" fill="%23e5e7eb"/><rect x="20" y="85" width="200" height="5" fill="%23e5e7eb"/><rect x="20" y="100" width="200" height="5" fill="%23e5e7eb"/><rect x="20" y="125" width="90" height="15" fill="%232563eb" rx="2"/><rect x="20" y="150" width="200" height="5" fill="%23e5e7eb"/><rect x="20" y="165" width="200" height="5" fill="%23e5e7eb"/><rect x="20" y="190" width="90" height="15" fill="%232563eb" rx="2"/><rect x="20" y="215" width="200" height="5" fill="%23e5e7eb"/><rect x="20" y="230" width="200" height="5" fill="%23e5e7eb"/><rect x="20" y="245" width="200" height="5" fill="%23e5e7eb"/></svg>'
  },
  {
    value: 'minimalist',
    title: 'Minimalist',
    description: 'Simple and elegant with focus on content',
    photoSupported: false,
    imageSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320"><rect width="240" height="320" fill="white"/><text x="20" y="40" font-family="Arial" font-size="24" font-weight="bold" fill="%23111827">Minimalist</text><rect x="20" y="60" width="100" height="2" fill="%23111827"/><rect x="20" y="80" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="90" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="100" width="200" height="4" fill="%23e5e7eb"/><text x="20" y="130" font-family="Arial" font-size="14" font-weight="bold" fill="%23111827">Experience</text><rect x="20" y="140" width="60" height="2" fill="%23111827"/><rect x="20" y="160" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="170" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="180" width="120" height="4" fill="%23e5e7eb"/><text x="20" y="220" font-family="Arial" font-size="14" font-weight="bold" fill="%23111827">Education</text><rect x="20" y="230" width="60" height="2" fill="%23111827"/><rect x="20" y="250" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="260" width="160" height="4" fill="%23e5e7eb"/></svg>'
  },
  {
    value: 'creative',
    title: 'Creative',
    description: 'Colorful and expressive for creative fields',
    photoSupported: true,
    imageSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23ec4899;stop-opacity:1" /><stop offset="100%" style="stop-color:%238b5cf6;stop-opacity:1" /></linearGradient></defs><rect width="240" height="320" fill="white"/><rect x="0" y="0" width="240" height="80" fill="url(%23grad1)" rx="0"/><circle cx="50" cy="40" r="25" fill="white" stroke="%238b5cf6" stroke-width="2"/><text x="100" y="35" font-family="Arial" font-size="18" font-weight="bold" fill="white">Creative</text><text x="100" y="55" font-family="Arial" font-size="12" fill="white">Design Professional</text><rect x="20" y="100" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="110" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="120" width="160" height="4" fill="%23e5e7eb"/><rect x="20" y="150" width="80" height="20" rx="10" fill="url(%23grad1)"/><rect x="20" y="180" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="190" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="220" width="80" height="20" rx="10" fill="url(%23grad1)"/><rect x="20" y="250" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="260" width="160" height="4" fill="%23e5e7eb"/></svg>'
  },
  {
    value: 'academic',
    title: 'Academic',
    description: 'Traditional format for academic and research positions',
    photoSupported: true,
    imageSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320"><rect width="240" height="320" fill="white"/><text x="20" y="40" font-family="Times New Roman, serif" font-size="22" font-weight="bold" fill="%23111827">Academic</text><rect x="20" y="45" width="200" height="1" fill="%23111827"/><text x="20" y="60" font-family="Times New Roman, serif" font-size="12" fill="%23111827">PhD Candidate, Research Specialist</text><rect x="180" y="25" width="40" height="50" fill="%23f3f4f6" stroke="%23111827" stroke-width="1"/><text x="20" y="90" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="%23111827">EDUCATION</text><rect x="20" y="95" width="200" height="1" fill="%23111827"/><rect x="20" y="110" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="120" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="130" width="120" height="4" fill="%23e5e7eb"/><text x="20" y="160" font-family="Times New Roman, serif" font-size="14" font-weight="bold" fill="%23111827">PUBLICATIONS</text><rect x="20" y="165" width="200" height="1" fill="%23111827"/><rect x="20" y="180" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="190" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="200" width="200" height="4" fill="%23e5e7eb"/><rect x="20" y="210" width="120" height="4" fill="%23e5e7eb"/></svg>'
  },
  {
    value: 'modern',
    title: 'Modern',
    description: 'Contemporary design with a balanced layout',
    photoSupported: true,
    imageSrc: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320"><rect width="240" height="320" fill="white"/><rect x="0" y="0" width="80" height="320" fill="%232563eb"/><circle cx="40" cy="50" r="25" fill="white"/><text x="40" y="95" font-family="Arial" font-size="12" fill="white" text-anchor="middle">CONTACT</text><rect x="20" y="105" width="40" height="1" fill="white"/><rect x="15" y="115" width="50" height="3" fill="white" opacity="0.6"/><rect x="15" y="125" width="50" height="3" fill="white" opacity="0.6"/><rect x="15" y="145" width="50" height="3" fill="white" opacity="0.6"/><text x="40" y="170" font-family="Arial" font-size="12" fill="white" text-anchor="middle">SKILLS</text><rect x="20" y="180" width="40" height="1" fill="white"/><rect x="15" y="190" width="50" height="3" fill="white" opacity="0.6"/><rect x="15" y="200" width="50" height="3" fill="white" opacity="0.6"/><rect x="15" y="210" width="50" height="3" fill="white" opacity="0.6"/><text x="120" y="50" font-family="Arial" font-size="22" font-weight="bold" fill="%23111827">Modern</text><rect x="100" y="70" width="120" height="4" fill="%23e5e7eb"/><rect x="100" y="80" width="120" height="4" fill="%23e5e7eb"/><rect x="100" y="90" width="120" height="4" fill="%23e5e7eb"/><text x="100" y="120" font-family="Arial" font-size="14" font-weight="bold" fill="%232563eb">EXPERIENCE</text><rect x="100" y="130" width="20" height="2" fill="%232563eb"/><rect x="100" y="145" width="120" height="3" fill="%23e5e7eb"/><rect x="100" y="155" width="120" height="3" fill="%23e5e7eb"/><text x="100" y="185" font-family="Arial" font-size="14" font-weight="bold" fill="%232563eb">EDUCATION</text><rect x="100" y="195" width="20" height="2" fill="%232563eb"/><rect x="100" y="210" width="120" height="3" fill="%23e5e7eb"/><rect x="100" y="220" width="120" height="3" fill="%23e5e7eb"/></svg>'
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  includePhoto,
  onTemplateChange,
  onPhotoChange
}) => {
  const currentTemplate = templates.find(t => t.value === selectedTemplate) || templates[0];
  
  const handleTemplateClick = (template: TemplateType) => {
    onTemplateChange(template);
  };
  
  return (
    <Card className="mb-8 shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Choose CV Template</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div 
              key={template.value}
              onClick={() => handleTemplateClick(template.value)}
              className={`relative cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                selectedTemplate === template.value 
                  ? 'ring-2 ring-primary ring-offset-2' 
                  : 'border border-gray-200 hover:border-primary'
              } rounded-lg overflow-hidden`}
            >
              <div className="aspect-w-3 aspect-h-4 bg-gray-50">
                <img 
                  src={template.imageSrc} 
                  alt={`${template.title} template`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-4 bg-white">
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              </div>
              
              {selectedTemplate === template.value && (
                <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Template Settings</h3>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="include-photo" 
              checked={includePhoto} 
              onCheckedChange={(checked) => onPhotoChange(checked)}
              disabled={!currentTemplate.photoSupported}
            />
            <Label 
              htmlFor="include-photo" 
              className="flex items-center cursor-pointer"
            >
              <FileImage className="mr-2 h-4 w-4" />
              Include Photo {!currentTemplate.photoSupported && "(Not supported in this template)"}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;