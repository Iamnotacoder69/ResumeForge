import { useFieldArray } from "react-hook-form";
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
import { Plus, Trash2 } from "lucide-react";

type EducationSectionProps = {
  form: any;
};

const EducationSection = ({ form }: EducationSectionProps) => {
  const { toast } = useToast();
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "education"
  });
  
  const addEducation = () => {
    append({
      schoolName: "",
      major: "",
      startDate: "",
      endDate: "",
      achievements: ""
    });
    
    toast({
      title: "Success",
      description: "New education section added",
    });
  };
  
  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      toast({
        title: "Success",
        description: "Education section removed",
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot remove the last education section",
        variant: "destructive",
      });
    }
  };
  
  // Simplified approach - only add bullet points on Enter and initial typing
  const handleAchievementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    const fieldName = `education.${index}.achievements`;
    let text = e.target.value;
    
    // First, just update the text as-is to maintain cursor position for the user
    form.setValue(fieldName, text);
    
    // If user pressed Enter, add a bullet point to the new line
    if (text.endsWith('\n')) {
      // Update text with a bullet point after the newline
      form.setValue(fieldName, text + '• ');
      return;
    }
    
    // When starting to type in an empty field, add bullet point
    if (text.length === 1 && text !== '•' && text.trim() !== '') {
      form.setValue(fieldName, '• ' + text);
      return;
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark">Education</h2>
          <Button 
            type="button"
            size="sm"
            onClick={addEducation}
            className="self-start sm:self-auto"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Education
          </Button>
        </div>
        
        {fields.map((field, index) => (
          <div 
            key={field.id} 
            className="education-item border border-gray-200 rounded-md p-4 mb-6"
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Education</h3>
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
                name={`education.${index}.schoolName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="University of Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`education.${index}.major`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Major/Degree*</FormLabel>
                    <FormControl>
                      <Input placeholder="Bachelor of Science in Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`education.${index}.startDate`}
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
              
              <FormField
                control={form.control}
                name={`education.${index}.endDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name={`education.${index}.achievements`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achievements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={2} 
                      placeholder="• Type your achievements here (press Enter for a new bullet point)" 
                      className="resize-none"
                      {...field}
                      onChange={(e) => {
                        handleAchievementsChange(e, index);
                      }}
                    />
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

export default EducationSection;