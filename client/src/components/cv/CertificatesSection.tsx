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
    let text = e.target.value || "";
    const prevText = form.getValues(`certificates.${index}.achievements`) || "";
    const textArea = e.target;
    const cursorPosition = textArea.selectionStart;
    
    // Check if text was deleted (backspace/delete was pressed)
    if (prevText && text && prevText.length > text.length) {
      // Check if we're deleting the last bullet point or part of it
      const prevLines = prevText.split('\n');
      const currentLines = text.split('\n');
      
      // If we have fewer lines now, or the last line changed and contained a bullet
      if (currentLines.length < prevLines.length || 
          (prevLines[prevLines.length - 1].includes('•') && 
           currentLines.length === prevLines.length && 
           currentLines[currentLines.length - 1] !== prevLines[prevLines.length - 1])) {
        
        // Just accept the user's edit without reformatting
        form.setValue(`certificates.${index}.achievements`, text);
        return;
      }
    }
    
    // Check if Enter key was just pressed (current text has one more newline than previous text)
    if (text.endsWith('\n') || (text.split('\n').length > prevText.split('\n').length)) {
      // Get cursor position before the Enter was pressed
      const linesBefore = text.substring(0, cursorPosition).split('\n');
      const currentLineIndex = linesBefore.length - 1;
      
      // Process all lines
      const lines = text.split('\n');
      const formattedLines = lines.map((line, i) => {
        // Skip empty lines unless it's at the cursor position after pressing Enter
        if (line.trim() === '') {
          // If this is where the cursor is after pressing Enter, add a bullet point
          if (i === currentLineIndex) {
            return '• ';
          }
          return '';
        }
        
        // Add bullet point if the line doesn't already have one
        if (!line.trimStart().startsWith('•')) {
          return '• ' + line.trimStart();
        }
        return line;
      });
      
      // Join the lines back together
      text = formattedLines.join('\n');
      
      // Set the value and restore cursor position with adjustment for added bullet
      form.setValue(`certificates.${index}.achievements`, text);
      
      // Schedule cursor position restoration after React updates the DOM
      setTimeout(() => {
        // Find the textarea element again as it might have been rerendered
        const textarea = document.querySelector(`textarea[name="certificates.${index}.achievements"]`) as HTMLTextAreaElement;
        if (textarea) {
          // Calculate new cursor position - after the bullet point in the new line
          const newLines = text.split('\n');
          let newPosition = 0;
          for (let i = 0; i < currentLineIndex; i++) {
            newPosition += newLines[i].length + 1; // +1 for the newline character
          }
          newPosition += 2; // Position after the '• ' in the new line
          textarea.setSelectionRange(newPosition, newPosition);
          textarea.focus();
        }
      }, 0);
      
      return;
    }
    
    // Handle backspace at the beginning of a bullet point - allow removing the bullet
    if (prevText.length > text.length && prevText.includes('• ') && !text.includes('• ')) {
      form.setValue(`certificates.${index}.achievements`, text);
      return;
    }
    
    // Analyze the current text to find which line we're on and if it's missing a bullet
    const linesBeforeCursor = text.substring(0, cursorPosition).split('\n');
    const currentLineIndex = linesBeforeCursor.length - 1;
    const lines = text.split('\n');
    
    // Check if the current line we're typing on doesn't have a bullet
    if (currentLineIndex >= 0 && 
        currentLineIndex < lines.length && 
        lines[currentLineIndex].trim() !== '' && 
        !lines[currentLineIndex].trimStart().startsWith('•')) {
      
      // Add a bullet to just the current line
      const newLines = [...lines];
      newLines[currentLineIndex] = '• ' + newLines[currentLineIndex].trimStart();
      
      // Calculate the new cursor position after adding the bullet
      const oldCursorLinePosition = cursorPosition - text.substring(0, cursorPosition).lastIndexOf('\n') - 1;
      const newLinePosition = oldCursorLinePosition + 2; // +2 for the added bullet
      
      // Join the lines back together
      const newText = newLines.join('\n');
      form.setValue(`certificates.${index}.achievements`, newText);
      
      // Set cursor position after added bullet
      setTimeout(() => {
        const textarea = document.querySelector(`textarea[name="certificates.${index}.achievements"]`) as HTMLTextAreaElement;
        if (textarea) {
          let beforeCurrentLineLength = 0;
          for (let i = 0; i < currentLineIndex; i++) {
            beforeCurrentLineLength += newLines[i].length + 1; // +1 for the newline character
          }
          const newCursorPosition = beforeCurrentLineLength + newLinePosition;
          textarea.setSelectionRange(newCursorPosition, newCursorPosition);
          textarea.focus();
        }
      }, 0);
      
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
            className="self-start sm:self-auto bg-primary text-white hover:bg-primary/90 font-semibold"
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