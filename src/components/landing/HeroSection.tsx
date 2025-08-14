import { Button } from '@/components/ui/button';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(to_bottom,white_10%,transparent_50%)]"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 gap-12 items-center">
                <div className="flex flex-col gap-6 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tight text-foreground">
                        Forge Your Ultimate Physique with <span className="text-primary">Akram</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Elite bodybuilding coaching personalized for your goals. Unleash your potential and achieve results that speak for themselves.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transform hover:scale-105 transition-transform">
                            <Link href="#subscription-form">Join Now</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="#pricing">View Plans</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default HeroSection;
