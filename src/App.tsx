import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Trips from "./pages/Trips";
import TripDetail from "./pages/TripDetail";
import NewTrip from "./pages/NewTrip";
import Explore from "./pages/Explore";
import AiPlanner from "./pages/AiPlanner";
import AiChat from "./pages/AiChat";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/trips/new" element={<NewTrip />} />
              <Route path="/trips/:id" element={<TripDetail />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/ai-planner" element={<AiPlanner />} />
              <Route path="/chat" element={<AiChat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;