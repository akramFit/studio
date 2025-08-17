"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

// A simplified approach for admin check without custom claims, as requested.
// In a production app, use Firebase Custom Claims for robust role management.
const ADMIN_EMAILS = ['akram-coach@demo.com'];

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsAdmin(ADMIN_EMAILS.includes(user.email || ''));
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, isAdmin, loading };

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
      if (loading) return;

      const isAuthPage = pathname === '/login';
      
      if (!user || !isAdmin) {
        if (!isAuthPage) {
          router.push('/login');
        }
      } else {
        if (isAuthPage) {
          router.push('/admin');
        }
      }
    }, [user, isAdmin, loading, router, pathname]);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    // Allow rendering login page without being authenticated
    if (!user || !isAdmin) {
        if (pathname === '/login') {
            return <Component {...props} />;
        }
        return null; // or a loader
    }


    return <Component {...props} />;
  };
  return AuthenticatedComponent;
};
