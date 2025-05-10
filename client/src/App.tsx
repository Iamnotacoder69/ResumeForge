import { Switch, Route as WouterRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CVBuilder from "@/pages/CVBuilder";
import WelcomePage from "@/pages/WelcomePage";
import Layout from "@/components/layout/Layout";

interface RouteWithLayoutProps {
  component: React.ComponentType<any>;
}

function RouteWithLayout({ component: Component }: RouteWithLayoutProps) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <WouterRoute 
        path="/" 
        component={() => (
          <Layout>
            <WelcomePage />
          </Layout>
        )} 
      />
      <WouterRoute 
        path="/cv-builder" 
        component={() => (
          <Layout>
            <CVBuilder />
          </Layout>
        )} 
      />
      <WouterRoute component={NotFound} />
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
