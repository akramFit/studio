
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  phoneNumber: z.string().min(10, "Phone number seems too short."),
  age: z.coerce.number().min(16, "Must be at least 16 years old.").max(100),
  height: z.coerce.number().min(100, "Height in cm.").max(250),
  weight: z.coerce.number().min(30, "Weight in kg.").max(300),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  primaryGoal: z.enum(['fat_loss', 'muscle_gain', 'strength', 'other']),
  otherGoal: z.string().optional(),
  injuriesOrNotes: z.string().optional(),
  preferredPlan: z.string().min(1, "Please select a plan."),
  subscriptionDuration: z.coerce.number().int().min(1, "Please select a duration."),
  promoCode: z.string().optional(),
}).refine(data => {
    if (data.primaryGoal === 'other') {
        return data.otherGoal && data.otherGoal.trim().length > 0;
    }
    return true;
}, {
    message: "Please specify your goal.",
    path: ['otherGoal'],
});

interface Plan {
    id: string;
    name: string;
    price: number;
}
interface PromoCode {
    id: string;
    code: string;
    discountPercentage: number;
    status: 'active' | 'used';
}

const durationOptions = [
    { value: 1, label: "1 Month", discount: 0 },
    { value: 3, label: "3 Months", discount: 0.15 },
    { value: 6, label: "6 Months", discount: 0.18 },
    { value: 12, label: "1 Year", discount: 0.20 },
];

const DZD_TO_USD_RATE = 1 / 135;

const SubscriptionForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [totalPrice, setTotalPrice] = React.useState<number | null>(null);
  const [promoCodeStatus, setPromoCodeStatus] = React.useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, "pricing"), orderBy("durationDays"));
        const querySnapshot = await getDocs(q);
        const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
        setPlans(plansData);
      } catch (error) {
        console.error("Error fetching pricing plans: ", error);
      }
    };
    fetchPlans();
  }, []);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "", email: "", phoneNumber: "",
      age: undefined, height: undefined, weight: undefined,
      experienceLevel: undefined, primaryGoal: undefined, preferredPlan: undefined,
      subscriptionDuration: 1,
      injuriesOrNotes: "", otherGoal: "", promoCode: "",
    },
  });

  const primaryGoal = form.watch('primaryGoal');
  const selectedPlanName = form.watch('preferredPlan');
  const selectedDuration = form.watch('subscriptionDuration');

  React.useEffect(() => {
    if (selectedPlanName && selectedDuration && plans.length > 0) {
      const plan = plans.find(p => p.name === selectedPlanName);
      const durationInfo = durationOptions.find(d => d.value === selectedDuration);
      if (plan && durationInfo) {
        let finalPrice = plan.price * durationInfo.value * (1 - durationInfo.discount);
        if (appliedPromo) {
            finalPrice = finalPrice * (1 - appliedPromo.discountPercentage / 100);
        }
        setTotalPrice(Math.round(finalPrice));
      }
    } else {
      setTotalPrice(null);
    }
  }, [selectedPlanName, selectedDuration, plans, appliedPromo]);

  const handleApplyPromoCode = async () => {
    const code = form.getValues('promoCode')?.trim().toUpperCase();
    if (!code) return;
    setPromoCodeStatus('loading');
    setAppliedPromo(null);

    try {
        const promoRef = doc(db, 'promoCodes', code);
        const docSnap = await getDoc(promoRef);
        
        if (!docSnap.exists()) {
            setPromoCodeStatus('invalid');
            toast({ title: "Invalid Code", description: "This promo code does not exist.", variant: "destructive" });
            return;
        }

        const promoData = { id: docSnap.id, ...docSnap.data() } as PromoCode;

        if (promoData.status !== 'active') {
            setPromoCodeStatus('invalid');
            toast({ title: "Code Used", description: "This promo code has already been used.", variant: "destructive" });
            return;
        }
        
        setPromoCodeStatus('valid');
        setAppliedPromo(promoData);
        toast({ title: "Success!", description: `Applied ${promoData.discountPercentage}% discount.` });
    } catch (error) {
        setPromoCodeStatus('invalid');
        toast({ title: "Error", description: "Could not validate promo code.", variant: "destructive" });
    }
  };


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const dataToSubmit = { ...values };
      if (dataToSubmit.primaryGoal !== 'other') {
        delete dataToSubmit.otherGoal;
      }

      const orderRef = await addDoc(collection(db, 'orders'), {
        ...dataToSubmit,
        promoCode: appliedPromo ? appliedPromo.code : null,
        finalPrice: totalPrice,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      if (appliedPromo) {
        const promoRef = doc(db, 'promoCodes', appliedPromo.id);
        await updateDoc(promoRef, {
            status: 'used',
            usedByOrderId: orderRef.id,
            usedAt: serverTimestamp(),
        });
      }

      toast({
        title: "Application Sent!",
        description: "Thank you! Akram will review your application and get back to you shortly.",
      });
      form.reset();
      setAppliedPromo(null);
      setPromoCodeStatus('idle');
      setTotalPrice(null);
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPriceUSD = totalPrice !== null ? Math.round(totalPrice * DZD_TO_USD_RATE) : null;

  return (
    <section id="subscription-form" className="py-20 md:py-32 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <Card className="max-w-4xl mx-auto shadow-2xl bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-headline font-bold">Start Your Journey Today</CardTitle>
            <CardDescription className="pt-2 text-muted-foreground">Fill out the form below to apply for coaching. Spaces are limited.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={form.control} name="fullName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>Phone Number (with country code)</FormLabel><FormControl><Input placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" placeholder="25" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="height" render={({ field }) => (
                    <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="weight" render={({ field }) => (
                    <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="85" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="experienceLevel" render={({ field }) => (
                    <FormItem><FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select your experience" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner (&lt;1 year)</SelectItem>
                          <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                          <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="primaryGoal" render={({ field }) => (
                    <FormItem><FormLabel>Primary Goal</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select your main goal" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="fat_loss">Fat Loss</SelectItem>
                          <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                {primaryGoal === 'other' && (
                  <FormField control={form.control} name="otherGoal" render={({ field }) => (
                      <FormItem><FormLabel>Please Specify Your Goal</FormLabel><FormControl><Textarea placeholder="e.g., improve athletic performance..." {...field} /></FormControl><FormMessage /></FormItem>
                  )}/>
                )}
                
                <div className="space-y-8 pt-8 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                        <FormField control={form.control} name="preferredPlan" render={({ field }) => (
                        <FormItem><FormLabel>Preferred Plan</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a coaching plan" /></SelectTrigger></FormControl>
                            <SelectContent>{plans.map(plan => (<SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>))}</SelectContent>
                            </Select><FormMessage />
                        </FormItem>
                        )} />
                        <FormField control={form.control} name="subscriptionDuration" render={({ field }) => (
                            <FormItem><FormLabel>Subscription Duration</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a duration" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {durationOptions.map(option => (
                                            <SelectItem key={option.value} value={String(option.value)}>
                                                {option.label} {option.discount > 0 && <span className="text-muted-foreground ml-2">({option.discount * 100}% off)</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                     <FormField control={form.control} name="promoCode" render={({ field }) => (
                        <FormItem><FormLabel>Promo Code</FormLabel>
                           <div className="flex items-center gap-2">
                             <FormControl>
                                <Input 
                                    placeholder="Enter promo code" {...field} className="uppercase" 
                                    onChange={(e) => {
                                        field.onChange(e);
                                        setPromoCodeStatus('idle');
                                        setAppliedPromo(null);
                                    }}
                                />
                             </FormControl>
                             <Button type="button" variant="outline" onClick={handleApplyPromoCode} disabled={promoCodeStatus === 'loading'}>
                                {promoCodeStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Apply'}
                             </Button>
                             {promoCodeStatus === 'valid' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                             {promoCodeStatus === 'invalid' && <XCircle className="h-5 w-5 text-red-500" />}
                           </div>
                           <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                {totalPrice !== null && (
                    <div className="pt-4 border-t-2 border-dashed border-border">
                        <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                            <span className="text-lg font-semibold text-foreground">Total Price:</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-primary">{totalPrice.toLocaleString()} DZD</span>
                                {totalPriceUSD !== null && ( <p className="text-sm text-muted-foreground">(approx. ${totalPriceUSD.toLocaleString()} USD)</p>)}
                            </div>
                        </div>
                    </div>
                )}
                
                <FormField control={form.control} name="injuriesOrNotes" render={({ field }) => (
                  <FormItem><FormLabel>Any Injuries or Important Notes?</FormLabel><FormControl><Textarea placeholder="e.g., old shoulder injury..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" className="w-full bg-accent hover:bg-accent/90" size="lg" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Apply for Coaching'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SubscriptionForm;
