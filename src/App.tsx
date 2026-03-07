import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SplitBite from "./pages/SplitBite";
import ComingSoon from "./pages/ComingSoon";
import IncomeExpenses from "./pages/IncomeExpenses";
import PayDue from "./pages/PayDue";
import Remittance from "./pages/Remittance";
import Salary from "./pages/Salary";
import Assets from "./pages/Assets";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/splitbite" element={<SplitBite />} />
          <Route path="/income-expenses" element={<IncomeExpenses />} />
          <Route path="/pay-due" element={<PayDue />} />
          <Route path="/remittance" element={<Remittance />} />
          <Route path="/overtime" element={<ComingSoon title="Overtime Record" />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/gold" element={<ComingSoon title="Gold" />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
