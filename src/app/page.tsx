import Navbar from '@/components/shared/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import AchievementsSection from '@/components/landing/AchievementsSection';
import PricingSection from '@/components/landing/PricingSection';
import GallerySection from '@/components/landing/GallerySection';
import FaqSection from '@/components/landing/FaqSection';
import SubscriptionForm from '@/components/landing/SubscriptionForm';
import Footer from '@/components/shared/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
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
