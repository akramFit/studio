"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseAuthUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: FirebaseAuthUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Check for admin role in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profile = userDocSnap.data() as UserProfile;
          setUserProfile(profile);
          if (profile.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          // Fallback for user not in 'users' collection or if collection doesn't exist
          setIsAdmin(false); 
          setUserProfile({ uid: firebaseUser.uid, email: firebaseUser.email! });
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, userProfile, isAdmin, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const withAdminAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthenticatedComponent = (props: P) => {
    const { user, isAdmin, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (loading) {
        return; // Wait for auth state to be determined
      }

      const isAuthPage = pathname === '/login';

      if (user && isAdmin) {
        // User is authenticated and is an admin
        if (isAuthPage) {
          router.push('/admin'); // If on login page, redirect to admin dashboard
        }
      } else {
        // User is not authenticated or not an admin
        if (!isAuthPage) {
          router.push('/login'); // If not on login page, redirect there
        }
      }
    }, [user, isAdmin, loading, router, pathname]);

    // Render a loading state while checking authentication
    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    // If authenticated and on an admin page, or if on the login page, render the component
    if ((user && isAdmin) || pathname === '/login') {
        return <Component {...props} />;
    }

    // Otherwise, render nothing while redirecting
    return null;
  };
  return AuthenticatedComponent;
};
