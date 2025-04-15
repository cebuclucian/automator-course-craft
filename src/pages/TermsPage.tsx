
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const TermsPage = () => {
  const { language } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'ro' ? 'Termeni și Condiții' : 'Terms and Conditions'}
      </h1>
      
      <div className="prose dark:prose-invert max-w-none">
        {language === 'ro' ? (
          <>
            <p className="mb-4">Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}</p>
            
            <p className="mb-4">Bine ați venit pe platforma Automator.ro. Acești termeni și condiții descriu regulile și reglementările pentru utilizarea site-ului nostru.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-4">1. Informații despre Companie</h2>
            <p className="mb-4">
              MARADA AMC CONS S.R.L.<br />
              CUI: 43664657<br />
              Nr. Registrul Comerțului: J35/421/2021<br />
              Adresa: Sacalaz 818, județ Timiș, România<br />
              Telefon: +40734205111<br />
              Email: contact@automator.ro
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">2. Acceptarea Termenilor</h2>
            <p className="mb-4">Prin accesarea și utilizarea acestui website, acceptați să respectați acești termeni și condiții de utilizare. Dacă nu sunteți de acord cu oricare dintre acești termeni, vă rugăm să nu utilizați website-ul nostru.</p>

            <h2 className="text-xl font-semibold mt-6 mb-4">3. Proprietate Intelectuală</h2>
            <p className="mb-4">Toate materialele prezente pe acest site, incluzând dar nelimitându-se la text, imagini, grafică, logo-uri, sunt proprietatea MARADA AMC CONS S.R.L. sau a licențiatorilor săi și sunt protejate de legile privind drepturile de autor.</p>
          </>
        ) : (
          <>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US')}</p>
            
            <p className="mb-4">Welcome to Automator.ro. These terms and conditions outline the rules and regulations for the use of our website.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-4">1. Company Information</h2>
            <p className="mb-4">
              MARADA AMC CONS S.R.L.<br />
              Tax ID: 43664657<br />
              Trade Registry: J35/421/2021<br />
              Address: Sacalaz 818, Timis County, Romania<br />
              Phone: +40734205111<br />
              Email: contact@automator.ro
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">2. Terms Acceptance</h2>
            <p className="mb-4">By accessing and using this website, you accept and agree to be bound by these terms and conditions of use. If you disagree with any part of these terms, please do not use our website.</p>

            <h2 className="text-xl font-semibold mt-6 mb-4">3. Intellectual Property</h2>
            <p className="mb-4">All materials on this site, including but not limited to text, images, graphics, logos, are the property of MARADA AMC CONS S.R.L. or its licensors and are protected by copyright laws.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TermsPage;
