import { Card, CardContent } from '@/components/ui/card';
import { Award, ShieldCheck, HeartPulse } from 'lucide-react';
import Image from 'next/image';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <Image
              src="https://raw.githubusercontent.com/akramFit/Akram-Fit-Training-Assets/main/4M3A7984.jpg"
              alt="Coach Akram"
              width={600}
              height={700}
              className="rounded-lg object-cover shadow-xl relative"
            />
          </div>
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold text-card-foreground">Meet Your Coach, Akram</h2>
            <p className="text-muted-foreground">
              With over a decade of experience in competitive bodybuilding and professional coaching, Akram has dedicated his life to the art and science of physique transformation. His philosophy combines evidence-based training protocols with a deep understanding of nutrition and mindset, ensuring every athlete reaches their peak potential.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Card className="bg-background/50">
                <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                  <Award className="h-10 w-10 text-primary" />
                  <h3 className="font-semibold">10+ Years</h3>
                  <p className="text-sm text-muted-foreground">Competitive Experience</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                  <ShieldCheck className="h-10 w-10 text-primary" />
                  <h3 className="font-semibold">Certified</h3>
                  <p className="text-sm text-muted-foreground">Personal Trainer & Nutritionist</p>
                </CardContent>
              </Card>
              <Card className="bg-background/50">
                <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                  <HeartPulse className="h-10 w-10 text-primary" />
                  <h3 className="font-semibold">Holistic</h3>
                  <p className="text-sm text-muted-foreground">Health-First Approach</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
