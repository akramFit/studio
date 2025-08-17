
"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Dumbbell, Crown, Star } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  durationDays: number;
  mostPopular?: boolean;
}

const iconMap: { [key: string]: React.ElementType } = {
  "Personal Training": Dumbbell,
  "Online Coaching": Check,
  "Online VIP": Crown,
};

const DZD_TO_USD_RATE = 1 / 135; // Approximate conversion rate

const PricingSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, "pricing"), orderBy("durationDays"));
        const querySnapshot = await getDocs(q);
        const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching pricing plans: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);


  return (
    <section id="pricing" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Choose Your Transformation Plan</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Invest in yourself. Flexible plans designed for serious results.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="flex flex-col shadow-lg">
                <CardHeader className="items-center text-center">
                  <Skeleton className="h-16 w-16 rounded-full mb-4" />
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-5 w-48 mt-2" />
                </CardHeader>
                <CardContent className="flex-1 space-y-4 pt-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-full" />
                </CardContent>
                <CardFooter className="flex-col items-stretch pt-6">
                  <Skeleton className="h-8 w-24 mb-4 mx-auto" />
                  <Skeleton className="h-12 w-full" />
                </CardFooter>
              </Card>
            ))
          ) : (
            plans.map((plan, index) => {
              const Icon = iconMap[plan.name] || Dumbbell;
              const priceUSD = Math.round(plan.price * DZD_TO_USD_RATE);
              return (
                <Card key={plan.id} className={cn(`flex flex-col shadow-lg transition-transform hover:scale-105 relative`, plan.mostPopular && "border-primary shadow-primary/20")}>
                   {plan.mostPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                      <Star className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="items-center text-center pt-8">
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl text-primary">{plan.name}</CardTitle>
                    {plan.description && <CardDescription className="text-base h-12">{plan.description}</CardDescription>}
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4 pt-4">
                    <ul className="space-y-3 text-muted-foreground">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch pt-6">
                    <div className="text-center mb-4">
                        <span className="text-2xl font-bold">{plan.price} DZD</span>
                        <span className="text-sm text-muted-foreground">/ month</span>
                        <p className="text-xs text-muted-foreground">(approx. ${priceUSD} USD)</p>
                    </div>
                    <Button asChild className={cn("w-full", plan.mostPopular && "bg-accent hover:bg-accent/90")} size="lg">
                      <Link href="#subscription-form">Get Started</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
