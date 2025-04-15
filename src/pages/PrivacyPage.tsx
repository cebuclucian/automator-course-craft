
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const PrivacyPage = () => {
  const { language } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {language === 'ro' ? 'Politica de Confidențialitate' : 'Privacy Policy'}
      </h1>
      
      <div className="prose dark:prose-invert max-w-none">
        {language === 'ro' ? (
          <>
            <p className="mb-4">Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}</p>
            
            <p className="mb-4">Această politică de confidențialitate descrie modul în care colectăm, folosim și protejăm informațiile dumneavoastră personale.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-4">1. Informații despre Operator</h2>
            <p className="mb-4">
              MARADA AMC CONS S.R.L.<br />
              CUI: 43664657<br />
              Nr. Registrul Comerțului: J35/421/2021<br />
              Adresa: Sacalaz 818, județ Timiș, România<br />
              Telefon: +40734205111<br />
              Email: contact@automator.ro
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">2. Informații Colectate</h2>
            <p className="mb-4">Colectăm informații pe care ni le furnizați direct, precum numele, adresa de email și alte date necesare pentru furnizarea serviciilor noastre.</p>

            <h2 className="text-xl font-semibold mt-6 mb-4">3. Utilizarea Informațiilor</h2>
            <p className="mb-4">Folosim informațiile colectate pentru a vă furniza serviciile noastre, a procesa plățile și a vă contacta în legătură cu contul dumneavoastră.</p>
          </>
        ) : (
          <>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString('en-US')}</p>
            
            <p className="mb-4">This privacy policy describes how we collect, use, and protect your personal information.</p>
            
            <h2 className="text-xl font-semibold mt-6 mb-4">1. Data Controller Information</h2>
            <p className="mb-4">
              MARADA AMC CONS S.R.L.<br />
              Tax ID: 43664657<br />
              Trade Registry: J35/421/2021<br />
              Address: Sacalaz 818, Timis County, Romania<br />
              Phone: +40734205111<br />
              Email: contact@automator.ro
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, such as your name, email address, and other data necessary to provide our services.</p>

            <h2 className="text-xl font-semibold mt-6 mb-4">3. Use of Information</h2>
            <p className="mb-4">We use the collected information to provide you with our services, process payments, and contact you regarding your account.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivacyPage;
