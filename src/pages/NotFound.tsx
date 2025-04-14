
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "User Agent:",
      navigator.userAgent,
      "Referrer:",
      document.referrer
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
          {language === 'ro' ? 'Oops! Pagina nu a fost găsită' : 'Oops! Page not found'}
        </p>
        <a 
          href="/" 
          className="text-automator-500 hover:text-automator-700 underline dark:text-automator-400 dark:hover:text-automator-300"
        >
          {language === 'ro' ? 'Înapoi la pagina principală' : 'Return to Home'}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
