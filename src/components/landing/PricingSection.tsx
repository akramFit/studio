"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Check, Dumbbell, Crown } from 'lucide-react';
import Link from 'next/link';

const pricingData = [
  {
    icon: Dumbbell,
    title: "Personal Training",
    description: "One-on-one sessions",
    features: [
      "4 day/week one to one training",
      "Training and nutrition program",
      "Nutrition consultation (weekly)",
    ],
    price: "15000 DZD",
    buttonText: "Get Started",
  },
  {
    icon: Check,
    title: "Online Coaching",
    description: "Personalized meal plans and training programs",
    features: [
      "Training and nutrition program",
      "Nutrition consultation (monthly)",
    ],
    price: "6000 DZD",
    buttonText: "Get Started",
    popular: true,
  },
  {
    icon: Crown,
    title: "Online VIP",
    description: "All Online Coaching services plus daily support",
    features: [
      "Training and nutrition program",
      "Nutrition consultation (monthly)",
      "Daily consulting",
      "Daily WhatsApp messaging",
    ],
    price: "10000 DZD",
    buttonText: "Get Started",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Choose Your Transformation Plan</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Invest in yourself. Flexible plans designed for serious results.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {pricingData.map((plan, index) => (
            <Card key={index} className={`flex flex-col shadow-lg transition-transform hover:scale-105 ${plan.popular ? 'border-primary border-2 relative' : ''}`}>
               {plan.popular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1 text-sm font-semibold text-primary-foreground bg-primary rounded-full">Most Popular</div>}
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                   <plan.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl text-primary">{plan.title}</CardTitle>
                <CardDescription className="text-base h-12">{plan.description}</CardDescription>
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
                 <div className="text-center text-4xl font-bold mb-4">{plan.price}</div>
                <Button asChild className="w-full" size="lg">
                  <Link href="#subscription-form">{plan.buttonText}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
