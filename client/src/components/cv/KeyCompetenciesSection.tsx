import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import TagInput from "@/components/ui/tag-input";

type KeyCompetenciesSectionProps = {
  form: any;
};

const KeyCompetenciesSection = ({ form }: KeyCompetenciesSectionProps) => {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Key Competencies</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Technical Skills</h3>
            <FormField
              control={form.control}
              name="keyCompetencies.technicalSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">List your technical skills such as programming languages, tools, and technologies</FormLabel>
                  <FormControl>
                    <TagInput
                      placeholder="Add a skill..."
                      tags={field.value || []}
                      setTags={(newTags) => field.onChange(newTags)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Soft Skills</h3>
            <FormField
              control={form.control}
              name="keyCompetencies.softSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground">List your soft skills such as leadership, communication, and teamwork</FormLabel>
                  <FormControl>
                    <TagInput
                      placeholder="Add a skill..."
                      tags={field.value || []}
                      setTags={(newTags) => field.onChange(newTags)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyCompetenciesSection;