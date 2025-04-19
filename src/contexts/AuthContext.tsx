
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { useAuthMethods } from "@/hooks/useAuthMethods";
import { useUserRefresh } from "@/hooks/useUserRefresh";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithGithub: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>; 
  logout: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void | boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize central user state and loading state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Tracking to prevent duplicate initialization
  const [initialized, setInitialized] = useState(false);
  
  // Get auth methods with state setters passed in
  const { 
    login, 
    register, 
    loginWithGoogle, 
    loginWithGithub, 
    loginWithFacebook, 
    logout 
  } = useAuthMethods({
    setUser,
    setIsLoading,
    setError
  });
  
  const { refreshUser } = useUserRefresh();

  // Add safety timeout to prevent infinite loading state - redus la 3 secunde
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        setIsLoading(false);
        console.log("AuthContext - Safety timeout triggered, forcing loading state to complete");
      }, 3000); // 3 secunde maximum timeout
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

  // Effect to update user data when refreshed - modificat pentru a preveni loop-urile
  useEffect(() => {
    let isMounted = true;
    
    // Facem inițializarea doar o singură dată
    if (initialized) {
      console.log("AuthContext - Already initialized, skipping");
      return;
    }
    
    const initializeUser = async () => {
      try {
        console.log("AuthContext - Initializing user...");
        setIsLoading(true);
        
        // Încercam să încărcăm utilizatorul din localStorage mai întâi
        const storedUser = localStorage.getItem('automatorUser');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("AuthContext - User loaded from localStorage:", 
              parsedUser.email || "No email");
            
            if (parsedUser && parsedUser.id && parsedUser.email) {
              setUser(parsedUser);
              setIsLoading(false);
              setInitialized(true);
              
              // Facem refresh în background dacă avem deja date
              refreshUser().catch(e => {
                console.error("AuthContext - Background refresh error:", e);
              });
              
              return; // Ieșim dacă am reușit să încărcăm din localStorage
            }
          } catch (e) {
            console.error("AuthContext - Error parsing stored user:", e);
            // Clear corrupted user data
            localStorage.removeItem('automatorUser');
          }
        }
        
        // Dacă nu am reușit să încărcăm din localStorage, facem refresh complet
        await refreshUser();
        
        // După refresh, verificăm dacă user data există în localStorage
        if (isMounted) {
          const refreshedUser = localStorage.getItem('automatorUser');
          if (refreshedUser) {
            try {
              const parsedUser = JSON.parse(refreshedUser);
              console.log("AuthContext - User loaded from localStorage after refresh:", 
                parsedUser.email || "No email");
              setUser(parsedUser);
            } catch (e) {
              console.error("AuthContext - Error parsing stored user after refresh:", e);
              // Clear corrupted user data
              localStorage.removeItem('automatorUser');
            }
          } else {
            console.log("AuthContext - No stored user found in localStorage after refresh");
          }
        }
      } catch (err) {
        console.error("AuthContext - Error initializing user:", err);
        // Handle auth errors by resetting state
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeUser();
    
    return () => {
      isMounted = false;
    };
  }, [refreshUser, initialized]);
  
  // Add debugging to track user state changes
  useEffect(() => {
    console.log("AuthContext - User state changed:", user ? user.email : "null");
    console.log("AuthContext - Is loading:", isLoading);
  }, [user, isLoading]);

  // Handle auth errors centrally
  const handleAuthError = (error: any) => {
    console.error("AuthContext - Authentication error:", error);
    setIsLoading(false);
    setError(error instanceof Error ? error.message : "Unknown authentication error");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithGoogle,
        loginWithGithub,
        loginWithFacebook,
        logout,
        isLoading,
        error,
        refreshUser: async () => {
          try {
            const success = await refreshUser();
            if (success) {
              // After refresh, update user state from localStorage
              const storedUser = localStorage.getItem('automatorUser');
              if (storedUser) {
                try {
                  const parsedUser = JSON.parse(storedUser);
                  setUser(parsedUser);
                } catch (e) {
                  console.error("AuthContext - Error parsing user data after refresh:", e);
                  return false;
                }
              }
            }
            return success;
          } catch (error) {
            console.error("AuthContext - Error in refreshUser:", error);
            handleAuthError(error);
            return false;
          } finally {
            // Ensure loading state is turned off
            setIsLoading(false);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthContext as well for potential direct use
export { AuthContext };
