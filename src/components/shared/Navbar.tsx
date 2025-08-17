"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#achievements', label: 'Achievements' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#faq', label: 'FAQ' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300",
      isMounted && isScrolled ? "bg-background/80 backdrop-blur-sm shadow-md" : "bg-transparent"
    )}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Akram Training Hub Home">
          <Dumbbell className="h-8 w-8 text-primary" />
          <span className="text-xl font-headline font-bold text-foreground">Akram Training Hub</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {label}
            </Link>
          ))}
          <Button asChild variant="outline">
            <Link href="/login">Admin</Link>
          </Button>
        </nav>
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 p-6">
                <Link href="/" className="flex items-center gap-2 mb-4" aria-label="Akram Training Hub Home">
                   <Dumbbell className="h-8 w-8 text-primary" />
                   <span className="text-xl font-headline font-bold">Akram Training</span>
                </Link>
                {navLinks.map(({ href, label }) => (
                  <Link key={href} href={href} className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                    {label}
                  </Link>
                ))}
                <Button asChild className="mt-4">
                  <Link href="/login">Admin</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
