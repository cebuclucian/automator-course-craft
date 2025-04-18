
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
import AuthModal from '@/components/AuthModal';

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

  // Folosim logourile în funcție de tema actuală
  const logoUrl = theme === 'dark' 
    ? '/lovable-uploads/86518970-c3fe-4d41-82e5-507cb74bdb9e.png'  // logo alb pentru tema întunecată
    : '/lovable-uploads/76fe2cce-52bf-4765-be5c-d70fea47e101.png';  // logo negru pentru tema luminoasă

  // Adăugăm un console.log pentru debugging
  console.log('Tema curentă:', theme);
  console.log('URL logo:', logoUrl);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          {/* Adăugăm fallback la text în caz că imaginea nu se încarcă */}
          <div className="flex items-center">
            <img 
              src={logoUrl}
              alt="Automator.ro Logo"
              className="h-10 w-auto"
              onError={(e) => {
                console.error('Eroare la încărcarea logo-ului:', logoUrl);
                // Schimbăm la text dacă imaginea nu se încarcă
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-xl font-bold text-black dark:text-white hidden">Automator.ro</span>
          </div>
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
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialMode={authMode} 
      />
    </header>
  );
};

export default Header;
