
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileNavProps {
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  isAuthenticated: boolean;
}

const MobileNav = ({ onOpenAuthModal, isAuthenticated }: MobileNavProps) => {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNavigate = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <div className="flex flex-col h-full py-6 space-y-6">
          <button onClick={() => handleNavigate('/about')} className="text-lg font-medium text-left">
            {t('nav.about')}
          </button>
          <button onClick={() => handleNavigate('/how-it-works')} className="text-lg font-medium text-left">
            {t('nav.howItWorks')}
          </button>
          <button onClick={() => handleNavigate('/generate')} className="text-lg font-medium text-left">
            {t('nav.generate')}
          </button>
          <button onClick={() => handleNavigate('/packages')} className="text-lg font-medium text-left">
            {t('nav.packages')}
          </button>
          <button onClick={() => handleNavigate('/contact')} className="text-lg font-medium text-left">
            {t('nav.contact')}
          </button>
          
          {!isAuthenticated && (
            <>
              <Button 
                variant="outline" 
                onClick={() => { 
                  setSheetOpen(false);
                  onOpenAuthModal('login'); 
                }}
                className="w-full"
              >
                {t('nav.login')}
              </Button>
              <Button 
                variant="default" 
                onClick={() => { 
                  setSheetOpen(false);
                  onOpenAuthModal('register'); 
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
  );
};

export default MobileNav;
