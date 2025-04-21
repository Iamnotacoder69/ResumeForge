import { useFieldArray, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import TagInput from "@/components/ui/tag-input";

type AdditionalInfoSectionProps = {
  form: any;
};

const proficiencyLevels = [
  { value: "native", label: "Native" },
  { value: "fluent", label: "Fluent" },
  { value: "advanced", label: "Advanced" },
  { value: "intermediate", label: "Intermediate" },
  { value: "basic", label: "Basic" },
];

const AdditionalInfoSection = ({ form }: AdditionalInfoSectionProps) => {
  const { toast } = useToast();
  
  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control: form.control,
    name: "languages"
  });
  
  const addLanguage = () => {
    appendLanguage({
      name: "",
      proficiency: "intermediate"
    });
    
    toast({
      title: "Success",
      description: "New language added",
    });
  };
  
  const handleRemoveLanguage = (index: number) => {
    if (languageFields.length > 1) {
      removeLanguage(index);
      toast({
        title: "Success",
        description: "Language removed",
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot remove the last language",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark mb-4 sm:mb-6">Additional Information</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Computer Skills</h3>
          
          <FormField
            control={form.control}
            name="additional.skills"
            render={({ field }) => (
              <FormItem>
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
          <h3 className="text-lg font-medium text-gray-900 mb-3">Languages</h3>
          
          <div className="space-y-4">
            {languageFields.map((field, index) => (
              <div 
                key={field.id} 
                className="language-item grid grid-cols-3 gap-4 items-center border border-gray-200 rounded-md p-3"
              >
                <FormField
                  control={form.control}
                  name={`languages.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Language" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name={`languages.${index}.proficiency`}
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select proficiency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {proficiencyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLanguage(index)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              type="button"
              variant="outline"
              onClick={addLanguage}
              className="text-primary border-primary hover:bg-blue-50"
            >
              <Plus className="mr-1 h-4 w-4" /> Add Language
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalInfoSection;
