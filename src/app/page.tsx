
"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import Navbar from '@/components/shared/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import Footer from '@/components/shared/Footer';

const AboutSection = dynamic(() => import('@/components/landing/AboutSection'), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
});
const AchievementsSection = dynamic(() => import('@/components/landing/AchievementsSection'), {
  loading: () => <Skeleton className="h-[600px] w-full" />,
});
const PricingSection = dynamic(() => import('@/components/landing/PricingSection'), {
  loading: () => <Skeleton className="h-[600px] w-full" />,
});
const GallerySection = dynamic(() => import('@/components/landing/GallerySection'), {
  loading: () => <Skeleton className="h-[600px] w-full" />,
});
const FaqSection = dynamic(() => import('@/components/landing/FaqSection'), {
  loading: () => <Skeleton className="h-[500px] w-full" />,
  ssr: false,
});
const SubscriptionForm = dynamic(() => import('@/components/landing/SubscriptionForm'), {
  loading: () => <Skeleton className="h-[700px] w-full" />,
  ssr: false,
});


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <AchievementsSection />
        <PricingSection />
        <GallerySection />
        <FaqSection />
        <SubscriptionForm />
      </main>
      <Footer />
    </div>
  );
}
