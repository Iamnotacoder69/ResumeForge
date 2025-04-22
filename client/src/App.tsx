import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CVBuilder from "@/pages/CVBuilder";
import LandingPage from "@/pages/LandingPage";

function Router() {
  return (
    <Switch>
      {/* Landing Page - Entry point */}
      <Route path="/" component={LandingPage} />
      
      {/* CV Builder Routes */}
      <Route path="/cv/template" component={CVBuilder} />
      <Route path="/cv/edit/:id">
        {(params) => <CVBuilder cvId={parseInt(params.id, 10)} />}
      </Route>
      
      {/* Legacy route redirection */}
      <Route path="/cv">
        <Redirect to="/" />
      </Route>
      
      {/* 404 Fallback */}
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
