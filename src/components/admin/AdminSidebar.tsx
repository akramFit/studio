
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  GalleryHorizontal,
  Trophy,
  DollarSign,
  LogOut,
  Inbox,
  Banknote,
  Calendar,
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/shared/Logo';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: Inbox },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/schedule', label: 'Schedule', icon: Calendar },
  { href: '/admin/finance', label: 'Finance', icon: Banknote },
  { href: '/admin/gallery', label: 'Gallery', icon: GalleryHorizontal },
  { href: '/admin/achievements', label: 'Achievements', icon: Trophy },
  { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push('/login');
    } catch (error) {
      toast({ title: "Error", description: "Failed to sign out.", variant: "destructive" });
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-card border-r flex flex-col">
      <div className="h-20 flex items-center justify-center px-6 border-b">
        <Link href="/admin" className="flex flex-col items-center text-center">
          <span className="text-xl font-bebas tracking-wider font-bold">Akram Fit Training</span>
          <span className="text-xs text-muted-foreground">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
           const isActive = pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin');
           return (
            <Link key={item.href} href={item.href}>
                <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn("w-full justify-start", {
                    "bg-accent text-accent-foreground hover:bg-accent/90": isActive
                })}
                >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
                </Button>
            </Link>
           )
        })}
      </nav>
      <div className="px-4 py-6 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
