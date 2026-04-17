import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

// Pages
import Home from "@/pages/home";
import ScanPage from "@/pages/scan";
import ScanDetail from "@/pages/scan-detail";
import Recommendations from "@/pages/recommendations";
import Crops from "@/pages/crops";
import Dashboard from "@/pages/dashboard";
import Reports from "@/pages/reports";
import ReportDetail from "@/pages/report-detail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/scan" component={ScanPage} />
        <Route path="/scan/:id" component={ScanDetail} />
        <Route path="/recommend" component={Recommendations} />
        <Route path="/crops" component={Crops} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/reports" component={Reports} />
        <Route path="/reports/:id" component={ReportDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
