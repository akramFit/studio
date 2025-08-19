
"use client";

import React from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AchievementItem {
  id: string;
  imageURL: string;
  caption: string;
  visible: boolean;
  transformationPeriod?: number;
}

const AchievementsSection = () => {
  const [achievements, setAchievements] = React.useState<AchievementItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      try {
        const achievementsCollection = collection(db, 'achievements');
        const q = query(achievementsCollection, orderBy('position'));
        const querySnapshot = await getDocs(q);
        const itemsData = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as AchievementItem))
            .filter(item => item.visible !== false);
        setAchievements(itemsData);
      } catch (error) {
        console.error("Error fetching achievements data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  return (
    <section id="achievements" className="py-20 md:py-32 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-white">Client Transformations & Achievements</h2>
          <p className="text-slate-300 mt-2 max-w-2xl mx-auto">Real clients, real results. A showcase of dedication and hard work.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <Skeleton className="w-full max-w-xl h-96 rounded-lg" />
          </div>
        ) : (
          <div className="flex justify-center">
            <Carousel className="w-full max-w-xl">
              <CarouselContent>
                {achievements.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="p-1">
                      <Card className="overflow-hidden bg-transparent border-none">
                        <CardContent className="flex flex-col aspect-square items-center justify-center p-0 relative">
                          <div className="relative group w-full h-full">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <Image
                                src={item.imageURL || 'https://placehold.co/600x800.png'}
                                alt={item.caption || 'Achievement image'}
                                width={600}
                                height={800}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative rounded-lg"
                                data-ai-hint="fitness transformation"
                              />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
                            <div className="absolute bottom-4 left-4 text-white text-sm font-medium pr-16">{item.caption}</div>
                            {item.transformationPeriod && (
                              <Badge className="absolute bottom-4 right-4 bg-primary/80 backdrop-blur-sm">
                                  <Clock className="mr-1.5 h-3 w-3" />
                                  {item.transformationPeriod} Months
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
};

export default AchievementsSection;
