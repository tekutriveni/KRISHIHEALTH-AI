import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useLanguage } from "@/hooks/useLanguage";
import Home from "@/pages/home";
import Disease from "@/pages/disease";
import Health from "@/pages/health";
import Mandi from "@/pages/mandi";
import Chat from "@/pages/chat";
import Alerts from "@/pages/alerts";
import NotFound from "@/pages/not-found";
import Weather from "@/pages/weather";
import Farm from "@/pages/farm";
function Router() {
  const { language, setLanguage } = useLanguage();

  return (
    <Layout language={language} setLanguage={setLanguage}>
      <Switch>
        <Route path="/" component={() => <Home language={language} />} />
        <Route
          path="/disease"
          component={() => <Disease language={language} />}
        />
        <Route
          path="/health"
          component={() => <Health language={language} />}
        />
        <Route path="/mandi" component={() => <Mandi language={language} />} />
        <Route path="/chat" component={() => <Chat language={language} />} />
        <Route
          path="/alerts"
          component={() => <Alerts language={language} />}
        />
        <Route
          path="/weather"
          component={() => <Weather language={language} />}
        />
        <Route path="/farm" component={() => <Farm language={language} />} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
