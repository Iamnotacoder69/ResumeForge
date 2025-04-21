import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wand2 } from "lucide-react";

type SummarySectionProps = {
  form: any;
};

const SummarySection = ({ form }: SummarySectionProps) => {
  const { toast } = useToast();
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const enhanceMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/enhance-text", {
        text,
        type: "summary"
      });
      const data = await response.json();
      return data.data.enhancedText;
    },
    onSuccess: (enhancedText) => {
      form.setValue("professional.summary", enhancedText, { shouldValidate: true });
      setIsEnhancing(false);
      toast({
        title: "Success!",
        description: "Your summary has been professionally enhanced",
      });
    },
    onError: (error) => {
      setIsEnhancing(false);
      toast({
        title: "Error",
        description: `Failed to enhance text: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  const handleEnhance = () => {
    const summary = form.getValues("professional.summary");
    if (!summary.trim()) {
      toast({
        title: "Error",
        description: "Please write a summary before enhancing",
        variant: "destructive",
      });
      return;
    }
    
    setIsEnhancing(true);
    enhanceMutation.mutate(summary);
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-semibold text-neutral-dark mb-6">Professional Summary</h2>
        
        <FormField
          control={form.control}
          name="professional.summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary*</FormLabel>
              <FormControl>
                <div className="relative">
                  <Textarea 
                    rows={4} 
                    placeholder="Write a professional summary that highlights your skills and experience..." 
                    className="resize-none pr-4 md:pr-32"
                    {...field}
                  />
                  <div className="w-full flex justify-end mt-2 md:mt-0">
                    <Button
                      type="button"
                      size="sm"
                      className="absolute bottom-2 right-2 bg-primary text-white hover:bg-primary/90 rounded-md border border-primary md:static md:mb-0 md:mt-2 md:z-10"
                      onClick={handleEnhance}
                      disabled={isEnhancing}
                    >
                      {isEnhancing ? (
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
      </CardContent>
    </Card>
  );
};

export default SummarySection;
