
import React from 'react';
import AccountDashboard from '@/components/AccountDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AccountPage = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <div>
      <AccountDashboard />
    </div>
  );
};

export default AccountPage;
