import { Switch, Route as WouterRoute, useLocation } from "wouter";
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

function Route({ component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  return <WouterRoute {...rest} component={(props: any) => <RouteWithLayout component={() => <component {...props} />} />} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomePage} />
      <Route path="/cv-builder" component={CVBuilder} />
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
