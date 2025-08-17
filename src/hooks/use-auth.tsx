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
