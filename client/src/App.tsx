import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CVBuilder from "@/pages/CVBuilder";
import WelcomePage from "@/pages/WelcomePage";
import Layout from "@/components/layout/Layout";

// Wrap each route with our layout
function RouteWithLayout({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <RouteWithLayout>
          <WelcomePage />
        </RouteWithLayout>
      </Route>
      <Route path="/builder">
        <RouteWithLayout>
          <CVBuilder />
        </RouteWithLayout>
      </Route>
      <Route>
        <RouteWithLayout>
          <NotFound />
        </RouteWithLayout>
      </Route>
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
