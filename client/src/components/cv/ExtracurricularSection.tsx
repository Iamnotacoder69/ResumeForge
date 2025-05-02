import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useFieldArray } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

type ExtracurricularSectionProps = {
  form: any;
};

const ExtracurricularSection = ({ form }: ExtracurricularSectionProps) => {
  const { toast } = useToast();
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "extracurricular",
  });
  
  const enhanceMutation = useMutation({
    mutationFn: async ({ text, index }: { text: string, index: number }) => {
      const response = await apiRequest("POST", "/api/enhance-text", {
        text,
        type: "responsibilities"
      });
      const data = await response.json();
      return { enhancedText: data.data.enhancedText, index };
    },
    onSuccess: ({ enhancedText, index }) => {
      form.setValue(`extracurricular.${index}.description`, enhancedText, { shouldValidate: true });
      setEnhancingIndex(null);
      toast({
        title: "Success!",
        description: "Your description has been professionally enhanced",
      });
    },
    onError: (error) => {
      setEnhancingIndex(null);
      toast({
        title: "Error",
        description: `Failed to enhance text: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  const addExtracurricular = () => {
    append({
      organization: "",
      role: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    });
    
    toast({
      title: "Success",
      description: "New activity section added",
    });
  };
  
  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      toast({
        title: "Success",
        description: "Activity section removed",
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot remove the last activity section",
        variant: "destructive",
      });
    }
  };
  
  const handleEnhance = (index: number) => {
    const description = form.getValues(`extracurricular.${index}.description`);
    if (description.trim().length < 10) {
      toast({
        title: "Error",
        description: "Please enter more text before enhancing",
        variant: "destructive",
      });
      return;
    }
    
    setEnhancingIndex(index);
    enhanceMutation.mutate({ text: description, index });
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    let text = e.target.value;
    
    // Check if Enter key was just pressed (text ends with newline)
    if (text.endsWith('\n')) {
      // Process the text to ensure all lines have bullet points
      const lines = text.split('\n');
      const formattedLines = lines.map((line, i) => {
        // Skip empty lines
        if (line.trim() === '') return '';
        
        // Add bullet point if the line doesn't already have one
        if (!line.trimStart().startsWith('•')) {
          return '• ' + line.trimStart();
        }
        return line;
      });
      
      // Add a new bullet point at the end if Enter was pressed
      if (lines[lines.length - 1].trim() === '') {
        formattedLines[formattedLines.length - 1] = '• ';
      }
      
      // Join the lines back together
      text = formattedLines.join('\n');
      form.setValue(`extracurricular.${index}.description`, text);
      return;
    }
    
    // Handle initial input - ensure first character is a bullet point
    if (text.trim() !== '' && !text.trimStart().startsWith('•')) {
      text = '• ' + text.trimStart();
      form.setValue(`extracurricular.${index}.description`, text);
      return;
    }
    
    form.setValue(`extracurricular.${index}.description`, text);
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark">Extracurricular Activities</h2>
          <Button 
            type="button"
            size="sm"
            onClick={addExtracurricular}
            className="self-start sm:self-auto"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Activity
          </Button>
        </div>
        
        {fields.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No extracurricular activities added yet. Add your volunteer work, personal projects, or other activities by clicking the button above.</p>
          </div>
        )}
        
        {fields.map((field, index) => (
          <div 
            key={field.id} 
            className="extracurricular-item border border-gray-200 rounded-md p-4 mb-6"
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Activity</h3>
              <div>
                <Button 
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormField
                control={form.control}
                name={`extracurricular.${index}.organization`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization/Project*</FormLabel>
                    <FormControl>
                      <Input placeholder="Community Center" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`extracurricular.${index}.role`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role*</FormLabel>
                    <FormControl>
                      <Input placeholder="Volunteer Coordinator" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`extracurricular.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormField
                  control={form.control}
                  name={`extracurricular.${index}.isCurrent`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue(`extracurricular.${index}.endDate`, "");
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Current Activity</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                {!form.watch(`extracurricular.${index}.isCurrent`) && (
                  <FormField
                    control={form.control}
                    name={`extracurricular.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel>End Date*</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name={`extracurricular.${index}.description`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea 
                        rows={4} 
                        placeholder="• Type your description here (press Enter for a new bullet point)" 
                        className="resize-none pr-4 md:pr-32"
                        {...field}
                        onChange={(e) => {
                          handleDescriptionChange(e, index);
                        }}
                      />
                      <div className="w-full flex justify-end mt-2 md:mt-0">
                        <Button
                          type="button"
                          size="sm"
                          className="absolute bottom-2 right-2 bg-primary text-white hover:bg-primary/90 rounded-md border border-primary md:static md:mb-0 md:mt-2 md:z-10"
                          onClick={() => handleEnhance(index)}
                          disabled={enhancingIndex === index}
                        >
                          {enhancingIndex === index ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Rewriting...
                            </>
                          ) : (
                            <>
                              <Wand2 className="mr-1 h-4 w-4" /> Rewrite with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ExtracurricularSection;