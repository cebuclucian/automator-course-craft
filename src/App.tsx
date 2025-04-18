
import {
  BrowserRouter as Router,
  Routes,
  Route,
  ScrollRestoration,
} from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { Toaster } from "@/components/ui/toaster"
import { useTheme } from "@/hooks/use-theme"

import {
  Home,
  AboutPage,
  HowItWorksPage,
  PackagesPage,
  ContactPage,
  TermsPage,
  PrivacyPage,
  NotFound,
} from "@/pages"
import AccountPage from "@/pages/AccountPage"
import GeneratePage from "@/pages/GeneratePage"
import MaterialDetailPage from "@/pages/MaterialDetailPage"

import Layout from "@/components/Layout"
import { AuthProvider } from "@/contexts/AuthContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { UserProfileProvider } from "@/contexts/UserProfileContext"
import { ThemeProvider } from "@/contexts/ThemeContext"

const queryClient = new QueryClient()

function AppContent() {
  const { theme } = useTheme()
  
  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      <div className="min-h-screen bg-background text-foreground dark:bg-background dark:text-foreground">
        <ScrollRestoration />
        <Toaster />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/account/materials/:id" element={<MaterialDetailPage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <UserProfileProvider>
              <AppContent />
            </UserProfileProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
