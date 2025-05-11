import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { SectionOrder } from "@shared/types";

interface SectionOrdererProps {
  sections: SectionOrder[];
  onReorder: (sections: SectionOrder[]) => void;
  onToggleVisibility: (sectionId: string, visible: boolean) => void;
  onDeleteSection?: (sectionId: string) => void;
}

const SectionOrderer: React.FC<SectionOrdererProps> = ({
  sections,
  onReorder,
  onToggleVisibility,
  onDeleteSection
}) => {
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    if (direction === 'up' && index > 0) {
      // Swap with previous
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      
      // Update order values
      newSections[index - 1].order = index - 1;
      newSections[index].order = index;
    } else if (direction === 'down' && index < sections.length - 1) {
      // Swap with next
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      
      // Update order values
      newSections[index].order = index;
      newSections[index + 1].order = index + 1;
    }
    
    onReorder(newSections);
  };

  const handleToggle = (sectionId: string, checked: boolean) => {
    onToggleVisibility(sectionId, checked);
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Section Order and Visibility</h2>
        
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop sections to reorder them or toggle visibility to show/hide sections in your CV.
        </p>
        
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div 
              key={section.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white"
            >
              <div className="flex items-center space-x-3">
                <div className="font-medium">{section.name}</div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={section.visible}
                    onCheckedChange={(checked) => handleToggle(section.id, checked)}
                    id={`toggle-${section.id}`}
                  />
                  <Label htmlFor={`toggle-${section.id}`} className="text-sm text-gray-500">
                    {section.visible ? 'Visible' : 'Hidden'}
                  </Label>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveSection(index, 'up')}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="sr-only">Move Up</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => moveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="sr-only">Move Down</span>
                </Button>
                {onDeleteSection && section.id !== 'personal' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteSection(section.id)}
                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-600 group relative"
                  >
                    <Trash2 className="h-4 w-4 group-hover:text-red-600" />
                    <span className="sr-only">Delete Section</span>
                    <span className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-md p-2 text-xs hidden group-hover:block z-10">
                      Delete this section and its data
                    </span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectionOrderer;