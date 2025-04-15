
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const DesktopNav = () => {
  const { t } = useLanguage();

  return (
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
  );
};

export default DesktopNav;
