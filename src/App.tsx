
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect } from 'react';
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
import ErrorBoundary from "./components/ErrorBoundary";

// Create QueryClient inside the component function
const App = () => {
  // Add global error handler for debugging
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Log to console as usual
      originalConsoleError(...args);
      
      // Save error to sessionStorage for debugging
      try {
        const errors = JSON.parse(sessionStorage.getItem('app_errors') || '[]');
        const newError = {
          timestamp: new Date().toISOString(),
          message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ')
        };
        errors.push(newError);
        sessionStorage.setItem('app_errors', JSON.stringify(errors.slice(-20))); // Keep last 20 errors
      } catch (e) {
        // Fail silently if storage fails
      }
    };

    // Add unhandled promise rejection listener
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  // Create a new QueryClient instance inside the component
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      }
    }
  });
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <LanguageProvider>
              <ThemeProvider>
                <AuthProvider>
                  <BrowserRouter>
                    <Layout>
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/how-it-works" element={<HowItWorksPage />} />
                          <Route path="/generate" element={<GeneratePage />} />
                          <Route path="/packages" element={<PackagesPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route path="/account" element={<AccountPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ErrorBoundary>
                    </Layout>
                  </BrowserRouter>
                </AuthProvider>
              </ThemeProvider>
            </LanguageProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
