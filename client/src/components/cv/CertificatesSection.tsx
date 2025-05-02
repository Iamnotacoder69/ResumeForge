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

type CertificatesSectionProps = {
  form: any;
};

const CertificatesSection = ({ form }: CertificatesSectionProps) => {
  const { toast } = useToast();
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "certificates"
  });
  
  const addCertificate = () => {
    append({
      institution: "",
      name: "",
      dateAcquired: "",
      expirationDate: "",
      achievements: ""
    });
    
    toast({
      title: "Success",
      description: "New certificate section added",
    });
  };
  
  const handleRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      toast({
        title: "Success",
        description: "Certificate section removed",
      });
    } else if (fields.length === 1) {
      remove(index);
      toast({
        title: "Success",
        description: "Certificate section removed",
      });
    }
  };
  
  const handleAchievementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    let text = e.target.value;
    
    // Special case: if the entire input is being cleared, allow it
    if (text.trim() === '') {
      form.setValue(`certificates.${index}.achievements`, '');
      return;
    }
    
    // Special case: handle backspace that would remove the last bullet point
    // If there's just a bullet point and space left, allow it to be deleted completely
    const existingText = form.getValues(`certificates.${index}.achievements`);
    if (existingText.trim() === '•' && text.trim() === '') {
      form.setValue(`certificates.${index}.achievements`, '');
      return;
    }
    
    // Check if Enter key was just pressed (text ends with newline)
    if (text.endsWith('\n')) {
      // Process the text to ensure all lines have bullet points
      const lines = text.split('\n');
      const formattedLines = lines.map((line, i) => {
        // Skip empty lines but preserve them
        if (line.trim() === '') return '';
        
        // Add bullet point if the line doesn't already have one
        if (!line.trimStart().startsWith('•')) {
          return '• ' + line.trimStart();
        }
        return line;
      });
      
      // Add a new bullet point at the end if Enter was pressed on a non-empty line
      if (lines.length > 1 && lines[lines.length - 2].trim() !== '' && lines[lines.length - 1].trim() === '') {
        formattedLines[formattedLines.length - 1] = '• ';
      }
      
      // Join the lines back together
      text = formattedLines.join('\n');
      form.setValue(`certificates.${index}.achievements`, text);
      return;
    }
    
    // Handle initial input - ensure first character is a bullet point
    if (text.trim() !== '' && !text.trimStart().startsWith('•')) {
      text = '• ' + text.trimStart();
      form.setValue(`certificates.${index}.achievements`, text);
      return;
    }
    
    form.setValue(`certificates.${index}.achievements`, text);
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 sm:pt-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-dark">Certificates</h2>
          <Button 
            type="button"
            size="sm"
            onClick={addCertificate}
            className="self-start sm:self-auto"
          >
            <Plus className="mr-1 h-4 w-4" /> Add Certificate
          </Button>
        </div>
        
        {fields.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No certificates added yet. Add your first certificate by clicking the button above.</p>
          </div>
        )}
        
        {fields.map((field, index) => (
          <div 
            key={field.id} 
            className="certificate-item border border-gray-200 rounded-md p-4 mb-6"
          >
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Certificate</h3>
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
                name={`certificates.${index}.institution`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="AWS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`certificates.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="AWS Certified Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`certificates.${index}.dateAcquired`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Acquired*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name={`certificates.${index}.expirationDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (Optional)</FormLabel>
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
              name={`certificates.${index}.achievements`}
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

export default CertificatesSection;