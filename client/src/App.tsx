import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CVBuilder from "@/pages/CVBuilder";
import CVUploader from "@/components/cv/CVUploader";
import PdfTestPage from "@/pages/PdfTestPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={CVUploader} />
      <Route path="/cv-builder" component={CVBuilder} />
      <Route path="/pdf-test" component={PdfTestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
