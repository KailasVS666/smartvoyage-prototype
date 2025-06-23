import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  AuthError
} from 'firebase/auth';
import { auth, provider } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: (usePopup?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Handle redirect result when component mounts
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          setUser(result.user);
          toast({
            title: "Welcome!",
            description: "Successfully signed in with Google.",
          });
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
        const authError = error as AuthError;
        if (authError.code !== 'auth/cancelled-popup-request') {
          toast({
            title: "Sign In Failed",
            description: authError.message || "Failed to sign in with Google.",
            variant: "destructive",
          });
        }
      }
    };

    handleRedirectResult();
  }, [toast]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (usePopup: boolean = true) => {
    try {
      setLoading(true);
      if (usePopup) {
        await signInWithPopup(auth, provider);
      } else {
        await signInWithRedirect(auth, provider);
      }
      // Toast is shown after redirect result is handled
    } catch (error) {
      console.error('Error signing in with Google:', error);
      const authError = error as AuthError;
      if (authError.code !== 'auth/cancelled-popup-request') {
        toast({
          title: "Sign In Failed",
          description: authError.message || "Failed to sign in with Google.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      const authError = error as AuthError;
      toast({
        title: "Sign Out Failed",
        description: authError.message || "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 