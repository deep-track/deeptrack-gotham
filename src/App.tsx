import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "./app/page";
import Results from "./app/results/page";
import History from "./app/history/page";
import NotFound from "./app/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="deeptrack-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground theme-transition">
              {/* Header */}
              <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

              {/* Layout */}
              <div className="flex min-h-0 flex-1 relative">
                {/* Mobile Sidebar (optional slide-out) */}
                {sidebarOpen && (
                  <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-lg p-4 lg:hidden">
                    <Sidebar />
                  </aside>
                )}

                {/* Desktop Sidebar */}
                <aside className="hidden lg:block lg:w-64 border-r bg-card p-4">
                  <Sidebar />
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/history" element={<History />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
