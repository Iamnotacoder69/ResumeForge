import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  GraduationCap, 
  Briefcase, 
  Award, 
  Users, 
  GripVertical,
  Code,
  ArrowUp,
  ArrowDown
} from "lucide-react";

interface Section {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface SectionOrderingProps {
  sectionOrder: string[];
  onChange: (newOrder: string[]) => void;
}

const SECTIONS: Section[] = [
  { id: 'experience', name: 'Work Experience', icon: <Briefcase className="h-5 w-5" /> },
  { id: 'education', name: 'Education', icon: <GraduationCap className="h-5 w-5" /> },
  { id: 'competencies', name: 'Key Competencies', icon: <Code className="h-5 w-5" /> },
  { id: 'certificates', name: 'Certificates', icon: <Award className="h-5 w-5" /> },
  { id: 'extracurricular', name: 'Extracurricular Activities', icon: <Users className="h-5 w-5" /> },
];

const SectionOrdering: React.FC<SectionOrderingProps> = ({ sectionOrder, onChange }) => {
  // Get sorted sections based on order
  const getSortedSections = () => {
    const orderedSections = [...sectionOrder]
      .map(id => SECTIONS.find(section => section.id === id))
      .filter(Boolean) as Section[];
    
    // Add any missing sections at the end
    const missingIds = SECTIONS.filter(section => !sectionOrder.includes(section.id));
    return [...orderedSections, ...missingIds];
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    // If dropped outside a droppable area
    if (!destination) return;
    
    // If dropped in the same position
    if (destination.index === source.index) return;
    
    const sortedSections = getSortedSections();
    const [reorderedItem] = sortedSections.splice(source.index, 1);
    sortedSections.splice(destination.index, 0, reorderedItem);
    
    onChange(sortedSections.map(section => section.id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sortedSections = getSortedSections();
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Boundary check
    if (newIndex < 0 || newIndex >= sortedSections.length) return;
    
    // Swap the items
    [sortedSections[index], sortedSections[newIndex]] = [sortedSections[newIndex], sortedSections[index]];
    
    onChange(sortedSections.map(section => section.id));
  };

  const sortedSections = getSortedSections();

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">
          Arrange Sections
        </h2>
        
        <p className="text-sm text-gray-500 mb-4">
          Drag and drop sections to reorder them in your CV
        </p>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {sortedSections.map((section, index) => (
                  <Draggable key={section.id} draggableId={section.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="flex items-center justify-between bg-muted/30 rounded-md p-3 border border-border"
                      >
                        <div className="flex items-center">
                          <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                            <GripVertical className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2 text-primary">{section.icon}</span>
                            <span>{section.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === sortedSections.length - 1}
                            className="h-8 w-8 p-0"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        <p className="text-sm text-gray-500 mt-4">
          Personal information and professional summary will always appear at the top of your CV.
        </p>
      </CardContent>
    </Card>
  );
};

export default SectionOrdering;