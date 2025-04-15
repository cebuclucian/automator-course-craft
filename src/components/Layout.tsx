
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Logo from '@/assets/automator-white-logo.png';
import LogoDark from '@/assets/automator-black-logo.png';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNavigate = (path: string) => {
    setSheetOpen(false); // Închide meniul când se accesează o pagină
    navigate(path);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={theme === 'dark' ? Logo : LogoDark} 
              alt="Automator.ro Logo" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-sm hover:text-automator-600 dark:hover:text-automator-400">
              {t('nav.about')}
            </Link>
            <Link to="/how-it-works" className="text-sm hover:text-automator-600 dark:hover:text-automator-400">
              {t('nav.howItWorks')}
            </Link>
            <Link to="/generate" className="text-sm hover:text-automator-600 dark:hover:text-automator-400">
              {t('nav.generate')}
            </Link>
            <Link to="/packages" className="text-sm hover:text-automator-600 dark:hover:text-automator-400">
              {t('nav.packages')}
            </Link>
            <Link to="/contact" className="text-sm hover:text-automator-600 dark:hover:text-automator-400">
              {t('nav.contact')}
            </Link>
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center space-x-4">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage('ro')}>
                  🇷🇴 Română
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')}>
                  🇬🇧 English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Authentication */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {user.name || user.email.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/account">{t('nav.myAccount')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="outline" 
                className="hidden md:flex"
                onClick={() => handleOpenAuthModal('login')}
              >
                {t('nav.login')} / {t('nav.register')}
              </Button>
            )}

            {/* Mobile menu */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full py-6 space-y-6">
                  <button 
                    onClick={() => handleNavigate('/about')} 
                    className="text-lg font-medium text-left"
                  >
                    {t('nav.about')}
                  </button>
                  <button 
                    onClick={() => handleNavigate('/how-it-works')} 
                    className="text-lg font-medium text-left"
                  >
                    {t('nav.howItWorks')}
                  </button>
                  <button 
                    onClick={() => handleNavigate('/generate')} 
                    className="text-lg font-medium text-left"
                  >
                    {t('nav.generate')}
                  </button>
                  <button 
                    onClick={() => handleNavigate('/packages')} 
                    className="text-lg font-medium text-left"
                  >
                    {t('nav.packages')}
                  </button>
                  <button 
                    onClick={() => handleNavigate('/contact')} 
                    className="text-lg font-medium text-left"
                  >
                    {t('nav.contact')}
                  </button>
                  
                  {!user && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => { 
                          setSheetOpen(false);
                          handleOpenAuthModal('login'); 
                        }}
                        className="w-full"
                      >
                        {t('nav.login')}
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={() => { 
                          setSheetOpen(false);
                          handleOpenAuthModal('register'); 
                        }}
                        className="w-full"
                      >
                        {t('nav.register')}
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                &copy; {new Date().getFullYear()} Automator.ro. {language === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
              </p>
            </div>
            <div className="flex space-x-4">
              <Link to="/terms" className="text-sm text-gray-600 dark:text-gray-400 hover:text-automator-600 dark:hover:text-automator-400">
                {language === 'ro' ? 'Termeni și Condiții' : 'Terms & Conditions'}
              </Link>
              <Link to="/privacy" className="text-sm text-gray-600 dark:text-gray-400 hover:text-automator-600 dark:hover:text-automator-400">
                {language === 'ro' ? 'Politica de Confidențialitate' : 'Privacy Policy'}
              </Link>
              <Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-automator-600 dark:hover:text-automator-400">
                {language === 'ro' ? 'Contact' : 'Contact'}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </div>
  );
};

export default Layout;
