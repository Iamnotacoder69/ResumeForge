import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Code, Database, Globe, Server, Smartphone } from 'lucide-react';
import TagInput from "@/components/ui/tag-input";
import { CompleteCV } from '@shared/types';

type KeyCompetenciesSectionProps = {
  form: UseFormReturn<CompleteCV>;
};

const KeyCompetenciesSection: React.FC<KeyCompetenciesSectionProps> = ({ form }) => {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Key Competencies</h2>
        
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Code className="h-5 w-5 mr-2 text-primary" />
            <h3 className="text-lg font-medium text-gray-900">Technical Skills</h3>
          </div>
          
          <FormField
            control={form.control}
            name="competencies.technicalSkills"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <TagInput
                    placeholder="Add a technical skill..."
                    tags={field.value || []}
                    setTags={(newTags: string[]) => field.onChange(newTags)}
                  />
                </FormControl>
                <FormMessage />
                <p className="mt-2 text-sm text-gray-500">
                  List your programming languages, frameworks, tools, etc.
                </p>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="p-3 bg-muted/30 rounded-md flex flex-col items-center">
            <Database className="h-5 w-5 text-primary mb-1" />
            <span>Databases</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-md flex flex-col items-center">
            <Code className="h-5 w-5 text-primary mb-1" />
            <span>Languages</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-md flex flex-col items-center">
            <Server className="h-5 w-5 text-primary mb-1" />
            <span>Backend</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-md flex flex-col items-center">
            <Globe className="h-5 w-5 text-primary mb-1" />
            <span>Frontend</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-md flex flex-col items-center">
            <Smartphone className="h-5 w-5 text-primary mb-1" />
            <span>Mobile</span>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          Add your core technical skills to highlight your expertise. These will be prominently displayed in your CV.
        </p>
      </CardContent>
    </Card>
  );
};

export default KeyCompetenciesSection;