
import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';
import UserMenu from './UserMenu';
import Logo from '@/assets/automator-white-logo.png';
import LogoDark from '@/assets/automator-black-logo.png';

const Header = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');

  const handleOpenAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src={theme === 'dark' ? Logo : LogoDark} 
            alt="Automator.ro Logo" 
            className="h-10 w-auto"
          />
        </Link>

        <DesktopNav />

        <div className="flex items-center space-x-4">
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

          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Button 
              variant="outline" 
              className="hidden md:flex"
              onClick={() => handleOpenAuthModal('login')}
            >
              {language === 'ro' ? 'Autentificare / Înregistrare' : 'Login / Register'}
            </Button>
          )}

          <MobileNav 
            onOpenAuthModal={handleOpenAuthModal}
            isAuthenticated={!!user}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
