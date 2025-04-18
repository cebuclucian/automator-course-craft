
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p className="font-semibold mb-2">MARADA AMC CONS S.R.L.</p>
              <p>CUI: 43664657</p>
              <p>Reg. Com.: J35/421/2021</p>
              <p>Sacalaz 818, județ Timiș, România</p>
              <p>Tel: <a href="tel:+40734205111" className="hover:text-automator-600 dark:hover:text-automator-400">+40734205111</a></p>
              <p>Email: <a href="mailto:contact@automator.ro" className="hover:text-automator-600 dark:hover:text-automator-400">contact@automator.ro</a></p>
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end space-y-4">
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Automator.ro. {language === 'ro' ? 'Toate drepturile rezervate.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
