
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useState, useEffect } from 'react'; 
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import GeneratePage from "./pages/GeneratePage";
import PackagesPage from "./pages/PackagesPage";
import ContactPage from "./pages/ContactPage";
import AccountPage from "./pages/AccountPage";

// Create QueryClient inside the component function
const App = () => {
  // Create a new QueryClient instance inside the component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  const [hasError, setHasError] = useState(false);
  
  // Global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <BrowserRouter>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/how-it-works" element={<HowItWorksPage />} />
                      <Route path="/generate" element={<GeneratePage />} />
                      <Route path="/packages" element={
                        <ErrorBoundary fallback={<PackagesFallback />}>
                          <PackagesPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/contact" element={<ContactPage />} />
                      <Route path="/account" element={<AccountPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </BrowserRouter>
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// Simple fallback component for the Packages page
const PackagesFallback = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12">Pachetele noastre</h2>
      <p className="text-center text-lg">
        Momentan avem o problemă tehnică în afișarea pachetelor. Vă rugăm să încercați mai târziu sau să ne contactați direct.
      </p>
      <div className="mt-8 text-center">
        <a href="/contact" className="inline-flex items-center px-4 py-2 bg-automator-500 text-white rounded-md">
          Contactează-ne
        </a>
      </div>
    </div>
  );
};

export default App;
