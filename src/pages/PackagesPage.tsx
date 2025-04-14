
import React, { useEffect } from 'react';
import PackagesSection from '@/components/PackagesSection';
import ErrorBoundary from '@/components/ErrorBoundary';

const PackagesPage = () => {
  useEffect(() => {
    // Log that we're entering the packages page
    console.log('PackagesPage mounted');
    
    // Add basic diagnostics
    try {
      const userAgent = navigator.userAgent;
      const screenSize = `${window.innerWidth}x${window.innerHeight}`;
      console.log('Environment info:', { userAgent, screenSize });
    } catch (error) {
      console.error('Error collecting diagnostics:', error);
    }
    
    return () => {
      console.log('PackagesPage unmounted');
    };
  }, []);

  return (
    <div className="py-10">
      <ErrorBoundary fallback={
        <div className="p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Problema la încărcarea pachetelor</h2>
          <p className="mb-6">Ne pare rău, a apărut o eroare la încărcarea pachetelor disponibile.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Basic', 'Pro', 'Enterprise'].map(pkg => (
              <div key={pkg} className="border rounded-lg p-6 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{pkg}</h3>
                <p className="text-gray-500 mb-4">Pachetul {pkg}</p>
                <p className="italic mb-4">Detaliile pachetului nu sunt disponibile momentan.</p>
                <button 
                  className="mt-auto px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-md"
                  onClick={() => window.location.href = '/contact'}
                >
                  Contactează-ne
                </button>
              </div>
            ))}
          </div>
        </div>
      }>
        <PackagesSection />
      </ErrorBoundary>
    </div>
  );
};

export default PackagesPage;
