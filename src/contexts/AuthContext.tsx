'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { getFirebaseAuth, getGoogleProvider } from '@/lib/firebase';
import { CreditsService, UserCredits } from '@/services/credits';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  userCredits: UserCredits | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Rafraîchir les crédits de l'utilisateur
  const refreshCredits = async () => {
    if (user) {
      try {
        const credits = await CreditsService.getUserCredits(user.uid);
        setUserCredits(credits);
        setIsAdmin(credits?.isAdmin || false);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement des crédits:', error);
      }
    }
  };

  // Initialiser l'authentification côté client uniquement
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const auth = getFirebaseAuth();
      setAuthInitialized(true);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setUser(user);
        
        if (user) {
          try {
            // Vérifier si l'utilisateur existe
            let credits = await CreditsService.getUserCredits(user.uid);
            
            // Si l'utilisateur n'existe pas, le créer
            if (!credits) {
              credits = await CreditsService.createUser(user.uid, user.email!);
              toast.success('Bienvenue ! Vous avez reçu 3 crédits gratuits.');
            }
            
            setUserCredits(credits);
            setIsAdmin(credits.isAdmin || false);
          } catch (error) {
            console.error('Erreur lors de la récupération des crédits:', error);
            toast.error('Erreur lors de la connexion');
          }
        } else {
          setUserCredits(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Firebase:', error);
      setLoading(false);
    }
  }, []);

  // Se connecter avec Google
  const signInWithGoogle = async () => {
    if (!authInitialized) {
      toast.error('L\'authentification n\'est pas encore initialisée');
      return;
    }

    try {
      setLoading(true);
      const auth = getFirebaseAuth();
      const googleProvider = getGoogleProvider();
      const result = await signInWithPopup(auth, googleProvider);
      
      // L'utilisateur sera géré par onAuthStateChanged
      toast.success(`Bienvenue ${result.user.displayName || result.user.email}!`);
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Connexion annulée');
      } else {
        toast.error('Erreur lors de la connexion avec Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // Se déconnecter
  const logout = async () => {
    if (!authInitialized) return;

    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const value = {
    user,
    userCredits,
    loading,
    isAdmin,
    signInWithGoogle,
    logout,
    refreshCredits
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 