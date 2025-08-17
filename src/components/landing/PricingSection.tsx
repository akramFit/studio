"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Check, Dumbbell } from 'lucide-react';
import Link from 'next/link';

const pricingData = [
  {
    icon: Star,
    title: "Personal Training",
    description: "One-on-one sessions with expert trainers",
    items: [
      { name: "Single session", price: 85 },
      { name: "4-session package", price: 300 },
      { name: "8-session package", price: 560 },
    ],
    buttonText: "Book Session",
  },
  {
    icon: Check,
    title: "Nutrition Coaching",
    description: "Personalized meal plans and guidance",
    items: [
      { name: "Initial consultation", price: 120 },
      { name: "Monthly coaching", price: 200 },
      { name: "3-month program", price: 540 },
    ],
    buttonText: "Get Started",
  },
  {
    icon: Dumbbell,
    title: "Recovery Sessions",
    description: "Massage, stretching, and recovery therapy",
    items: [
      { name: "60-min massage", price: 95 },
      { name: "Recovery package (4)", price: 340 },
      { name: "Monthly unlimited", price: 280 },
    ],
    buttonText: "Book Recovery",
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingData.map((plan, index) => (
            <Card key={index} className="flex flex-col shadow-lg transition-transform hover:scale-105">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                   <plan.icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl text-primary">{plan.title}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-4">
                {plan.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-muted-foreground">
                    <span>{item.name}</span>
                    <span className="font-bold text-foreground">${item.price}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
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