
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import GeneratedMaterialList from '@/components/account/GeneratedMaterialList';
import { useAuth } from '@/contexts/AuthContext';

const MaterialsPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, refreshUser } = useAuth();
  
  // Refresh user data when the page loads
  useEffect(() => {
    console.log("MaterialsPage - Initial user data:", user);
    
    const loadData = async () => {
      console.log("MaterialsPage - Refreshing user data...");
      await refreshUser();
      console.log("MaterialsPage - User data after refresh:", user);
    };
    
    loadData();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" onClick={() => navigate('/account')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'ro' ? 'Înapoi' : 'Back'}
        </Button>
        <h1 className="text-2xl font-bold">
          {language === 'ro' ? 'Materiale generate' : 'Generated Materials'}
        </h1>
      </div>
      
      <GeneratedMaterialList />
    </div>
  );
};

export default MaterialsPage;
