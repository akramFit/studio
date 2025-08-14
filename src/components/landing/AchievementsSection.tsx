"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  year: string;
  description: string;
}

const AchievementsSection = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const achievementsCollection = collection(db, 'achievements');
        const q = query(achievementsCollection, orderBy('year', 'desc'));
        const querySnapshot = await getDocs(q);
        const achievementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
        setAchievements(achievementsData);
      } catch (error) {
        console.error("Error fetching achievements: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  return (
    <section id="achievements" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground">A Legacy of Excellence</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Decades of dedication, discipline, and success on the stage.</p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {achievements.map(achievement => (
              <Card key={achievement.id} className="bg-white hover:shadow-lg transition-shadow duration-300 group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="font-headline text-xl">{achievement.title}</CardTitle>
                      <CardDescription>{achievement.year}</CardDescription>
                    </div>
                    <Trophy className="h-8 w-8 text-yellow-500 group-hover:scale-110 transition-transform"/>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AchievementsSection;
