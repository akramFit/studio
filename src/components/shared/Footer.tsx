import { Twitter, Instagram, Facebook } from 'lucide-react';
import Link from 'next/link';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bebas tracking-wider font-bold text-card-foreground">Akram Fit Training</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Akram Fit Training. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#" aria-label="Twitter">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
            <Link href="https://www.instagram.com/akram_fit_ifbb?igsh=NHJkOGR1eWx3ODlt" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
            <Link href="https://www.facebook.com/share/1CakCu71Cc/" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
