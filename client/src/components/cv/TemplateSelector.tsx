import React, { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from 'lucide-react';

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
  // We now use a single standard template, but keep the professional type for backward compatibility
  const standardTemplate: TemplateType = 'professional';

  // Auto-select the standard template
  useEffect(() => {
    if (selectedTemplate !== standardTemplate) {
      onTemplateChange(standardTemplate);
      console.log("Standard template auto-selected:", standardTemplate);
    }
  }, [selectedTemplate, onTemplateChange, standardTemplate]);

  const handlePhotoToggle = () => {
    onPhotoInclusionChange(!includePhoto);
    console.log("Photo inclusion toggled:", !includePhoto);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4">Template Settings</h2>
        
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r mb-6">
          <div className="flex items-start">
            <div className="w-20 h-24 border border-primary rounded relative overflow-hidden mr-4 bg-white shrink-0">
              <div className="absolute top-0 left-0 w-full h-5 bg-blue-700"></div>
              <div className="absolute top-7 left-2 right-2 h-2 bg-blue-600 rounded"></div>
              <div className="absolute top-11 left-2 w-8 h-1.5 bg-gray-400 rounded"></div>
              <div className="absolute top-11 left-11 right-2 h-1 bg-gray-300 rounded"></div>
              <div className="absolute top-13 left-2 w-8 h-1.5 bg-gray-400 rounded"></div>
              <div className="absolute top-13 left-11 right-2 h-1 bg-gray-300 rounded"></div>
              <div className="absolute top-17 left-2 right-2 h-2 bg-blue-600 rounded"></div>
              <div className="absolute top-20 left-2 right-2 h-1 bg-gray-300 rounded"></div>
              <div className="absolute top-22 left-2 right-2 h-1 bg-gray-300 rounded"></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Professional Template</h3>
              <p className="text-sm text-gray-600">
                Your CV will use our professional template with clean, consistent spacing for optimal readability and presentation.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Template Features</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5 mr-2" />
              <span className="text-sm">Clean, professional layout with consistent spacing</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5 mr-2" />
              <span className="text-sm">Proper formatting for all section types</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5 mr-2" />
              <span className="text-sm">Automatic page breaks with proper section continuity</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5 mr-2" />
              <span className="text-sm">Support for all sections including languages and skills</span>
            </li>
          </ul>
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