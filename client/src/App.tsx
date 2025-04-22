import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import CVBuilder from "@/pages/CVBuilder";
import LandingPage from "@/pages/LandingPage";

// Custom Redirect component for wouter
const Redirect = ({ to }: { to: string }) => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation(to);
  }, [to, setLocation]);
  return null;
};

// Custom route component to handle the CV ID parameter
const CVEditRoute = () => {
  const [, params] = useRoute<{ id: string }>("/cv/edit/:id");
  const cvId = params?.id ? parseInt(params.id, 10) : undefined;
  return <CVBuilder cvId={cvId} />;
};

function Router() {
  return (
    <Switch>
      {/* Landing Page - Entry point */}
      <Route path="/" component={LandingPage} />
      
      {/* CV Builder Routes */}
      <Route path="/cv/template">
        <CVBuilder />
      </Route>
      <Route path="/cv/edit/:id" component={CVEditRoute} />
      
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
