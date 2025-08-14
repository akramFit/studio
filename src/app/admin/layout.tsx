"use client";

import { AuthProvider, useAuth } from '@/hooks/use-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { withAdminAuth } from '@/hooks/use-auth';
import { ReactNode } from 'react';

const AdminLayoutContent = ({ children }: { children: ReactNode }) => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <AdminSidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
};

const ProtectedAdminLayout = withAdminAuth(AdminLayoutContent);

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedAdminLayout>{children}</ProtectedAdminLayout>
        </AuthProvider>
    );
}
