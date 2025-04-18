
import React, { useEffect, useState } from 'react';
import AccountDashboard from '@/components/AccountDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const AccountPage = () => {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);
  const { toast } = useToast();
  
  // Load user data only once when the account page initially loads
  useEffect(() => {
    let isMounted = true;
    
    const loadUserData = async () => {
      if (!isMounted) return;
      
      setLocalLoading(true);
      try {
        // Fetch fresh user data when the account page loads
        const success = await refreshUser();
        console.log("User data refreshed on account page load, success:", success);
        console.log("Current user data after refresh:", user);
        
        // Debug the user's generated courses
        if (user && user.generatedCourses) {
          console.log("User has", user.generatedCourses.length, "generated courses");
          if (user.generatedCourses.length > 0) {
            console.log("First course subject:", user.generatedCourses[0].formData.subject);
          }
        } else {
          console.log("User has no generated courses or generatedCourses array is undefined");
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
        toast({
          title: "Eroare",
          description: "Nu s-a putut actualiza informațiile contului.",
          variant: "destructive"
        });
      } finally {
        if (isMounted) {
          setLocalLoading(false);
        }
      }
    };
    
    // Only refresh if we're not already loading
    if (!authLoading) {
      loadUserData();
    } else {
      setLocalLoading(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  if (authLoading || localLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
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
