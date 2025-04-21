import { useState } from "react";
import { useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Plus, Trash2 } from "lucide-react";

type ExperienceSectionProps = {
  form: any;
};

const ExperienceSection = ({ form }: ExperienceSectionProps) => {
  const { toast } = useToast();
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "experience"
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
      form.setValue(`experience.${index}.responsibilities`, enhancedText, { shouldValidate: true });
      setEnhancingIndex(null);
      toast({
        title: "Success!",
        description: "Your responsibilities have been professionally enhanced",
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
  
  const handleEnhance = (index: number) => {
    const responsibilities = form.getValues(`experience.${index}.responsibilities`);
    if (!responsibilities.trim()) {
      toast({
        title: "Error",
        description: "Please write responsibilities before enhancing",
        variant: "destructive",
      });
      return;
    }
    
    setEnhancingIndex(index);
    enhanceMutation.mutate({ text: responsibilities, index });
  };
  
  const addExperience = () => {
    append({
      companyName: "",
      jobTitle: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      responsibilities: ""
    });
    
    toast({
      title: "Success",
      description: "New experience section added",
    });
  };
  
  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      toast({
        title: "Success",
        description: "Experience section removed",
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot remove the last experience section",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark">Work Experience</h2>
          <Button 
            type="button"
            size="sm"
            onClick={addExperience}
            className="self-start sm:self-auto"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Experience
          </Button>
        </div>
        
        {fields.map((field, index) => (
          <div 
            key={field.id} 
            className="experience-item border border-gray-200 rounded-md p-4 mb-6"
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Experience</h3>
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
                name={`experience.${index}.companyName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`experience.${index}.jobTitle`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`experience.${index}.startDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date*</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        className="cursor-pointer"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormField
                  control={form.control}
                  name={`experience.${index}.isCurrent`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue(`experience.${index}.endDate`, "");
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Current Position</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                {!form.watch(`experience.${index}.isCurrent`) && (
                  <FormField
                    control={form.control}
                    name={`experience.${index}.endDate`}
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormLabel>End Date*</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            className="cursor-pointer"
                          />
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
              name={`experience.${index}.responsibilities`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsibilities*</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea 
                        rows={4} 
                        placeholder="Describe your key responsibilities and achievements..." 
                        className="resize-none pr-4 md:pr-32"
                        {...field}
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

export default ExperienceSection;
