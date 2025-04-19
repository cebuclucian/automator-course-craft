
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GeneratedCourse } from '@/types';
import { useToast } from './use-toast';

export const useUserRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const refreshUser = useCallback(async () => {
    if (isRefreshing) {
      console.log("useUserRefresh: Already refreshing, skipping");
      return false;
    }
    
    try {
      console.log("useUserRefresh: Starting refresh");
      setIsRefreshing(true);
      
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("useUserRefresh: Error getting session:", sessionError);
        return false;
      }
      
      if (!sessionData?.session) {
        console.log("useUserRefresh: No active session found");
        return false;
      }
      
      console.log("useUserRefresh: Session found, refreshing user data");
      
      // Get subscriber data from database
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .maybeSingle();
        
      if (subscriberError) {
        console.error("useUserRefresh: Error getting subscriber data:", subscriberError);
        return false;
      }
      
      console.log("useUserRefresh: Subscriber data obtained:", subscriberData || "No subscriber data found");
      
      // Get stored courses from localStorage
      let generatedCourses: GeneratedCourse[] = [];
      
      try {
        const automatorUser = localStorage.getItem('automatorUser');
        console.log("useUserRefresh: automatorUser exists in localStorage:", !!automatorUser);
        
        if (automatorUser) {
          try {
            const parsedUser = JSON.parse(automatorUser);
            console.log("useUserRefresh: Parsed user from localStorage:", {
              id: parsedUser.id,
              email: parsedUser.email,
              hasGeneratedCourses: !!parsedUser.generatedCourses,
            });
            
            if (parsedUser.generatedCourses && Array.isArray(parsedUser.generatedCourses)) {
              console.log("useUserRefresh: Found stored courses in localStorage:", parsedUser.generatedCourses.length);
              
              // Ensure all courses are properly normalized
              generatedCourses = parsedUser.generatedCourses
                .filter(course => course && typeof course === 'object') // Filter out invalid values
                .map((course: any) => {
                  // Make sure createdAt is a valid ISO string
                  let createdAt = course.createdAt || new Date().toISOString();
                  let expiresAt = course.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                  
                  // Make sure formData is a valid object
                  const formData = course.formData && typeof course.formData === 'object' 
                    ? course.formData 
                    : { subject: 'Curs necunoscut', level: 'Intermediar', audience: 'General', duration: '60 min' };
                  
                  // Make sure sections is a valid array
                  const sections = Array.isArray(course.sections) ? course.sections : [];
                  
                  // Return normalized course
                  return {
                    id: course.id || `course-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    createdAt,
                    expiresAt,
                    formData,
                    sections,
                    status: course.status || 'completed',
                    jobId: course.jobId || course.id || `job-${Date.now()}`
                  };
                });
              
              // Filter out corrupted courses
              generatedCourses = generatedCourses.filter(course => 
                course && course.formData && course.formData.subject && Array.isArray(course.sections));
              
              console.log("useUserRefresh: Normalized courses with correct data:", generatedCourses.length);
            } else if (parsedUser.generatedCourses) {
              console.error("useUserRefresh: generatedCourses exists but is not an array:", typeof parsedUser.generatedCourses);
              generatedCourses = []; // Reset to empty array if data is corrupted
              
              // Try to repair the stored data
              try {
                const fixedUser = {
                  ...parsedUser,
                  generatedCourses: [] // Ensure it's an array
                };
                localStorage.setItem('automatorUser', JSON.stringify(fixedUser));
                console.log("useUserRefresh: Fixed corrupted generatedCourses data in localStorage");
              } catch (e) {
                console.error("useUserRefresh: Error fixing corrupted data:", e);
              }
            }
          } catch (e) {
            console.error("useUserRefresh: Error parsing stored user data:", e);
            generatedCourses = [];
            
            // If we can't parse the data, it's probably corrupted, so let's clear it
            try {
              localStorage.removeItem('automatorUser');
              console.log("useUserRefresh: Removed corrupted automatorUser from localStorage");
            } catch (e) {
              console.error("useUserRefresh: Error removing corrupted data:", e);
            }
          }
        }
      } catch (e) {
        console.error("useUserRefresh: Error accessing localStorage:", e);
        generatedCourses = [];
      }
      
      // Build updated user object with proper data handling
      const updatedUser = {
        id: sessionData.session.user.id,
        email: subscriberData?.email || sessionData.session.user.email,
        name: sessionData.session.user.user_metadata?.name || subscriberData?.email?.split('@')[0] || 'Utilizator',
        subscription: {
          tier: subscriberData?.subscription_tier || 'Free',
          expiresAt: subscriberData?.subscription_end || new Date().toISOString(),
          active: !!subscriberData?.subscribed
        },
        generationsLeft: subscriberData?.generations_left !== undefined ? subscriberData.generations_left : 0,
        generatedCourses: generatedCourses,
        googleAuth: sessionData.session.user.app_metadata?.provider === 'google',
        lastGenerationDate: subscriberData?.last_generation_date || null
      };
      
      // Log courses before saving
      console.log("useUserRefresh: Generated courses before storage:", generatedCourses.length);
      
      // Update localStorage with consistent data format
      try {
        localStorage.setItem('automatorUser', JSON.stringify(updatedUser));
      } catch (storageError) {
        console.error("useUserRefresh: Error saving to localStorage:", storageError);
        // In case of localStorage error, don't stop the process - continue
      }
      
      console.log("useUserRefresh: User data updated and stored successfully");
      
      // Trigger event to inform all components about data update
      try {
        window.dispatchEvent(new Event('user-refreshed'));
      } catch (eventError) {
        console.error("useUserRefresh: Error triggering event:", eventError);
      }
      
      return true;
    } catch (error) {
      console.error("useUserRefresh: Error refreshing user data:", error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, toast]);
  
  return { refreshUser, isRefreshing };
};
