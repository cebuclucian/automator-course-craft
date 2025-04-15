
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();

  return (
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
  );
};

export default Footer;
