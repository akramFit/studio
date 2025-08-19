
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, User, Calendar, ShieldCheck, Clock, Target } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  membershipCode: z.string().min(6, "Membership code is required."),
});

interface ClientInfo {
    fullName: string;
    plan: string;
    endDate: any;
    isActive: boolean;
    daysLeft: number;
    currentGoalTitle?: string;
    targetMetric?: string;
    targetValue?: string;
    targetDate?: any;
}

const MembershipPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipCode: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setClientInfo(null);
    try {
      const q = query(collection(db, 'clients'), where('membershipCode', '==', values.membershipCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: 'Not Found', description: 'No active membership found with that code.', variant: 'destructive' });
      } else {
        const clientData = querySnapshot.docs[0].data();
        const endDate = clientData.endDate.toDate();
        const daysLeft = differenceInDays(endDate, new Date());
        const isActive = daysLeft >= 0;

        setClientInfo({
            fullName: clientData.fullName,
            plan: clientData.plan,
            endDate: clientData.endDate,
            isActive,
            daysLeft,
            currentGoalTitle: clientData.currentGoalTitle,
            targetMetric: clientData.targetMetric,
            targetValue: clientData.targetValue,
            targetDate: clientData.targetDate,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong while checking your membership.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysLeftColor = (days: number) => {
    if (days < 10) return "text-red-500";
    if (days < 20) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg bg-card">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">Check Membership</CardTitle>
                    <CardDescription>Enter your code to view your plan details.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="membershipCode"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Membership Code</FormLabel>
                            <FormControl>
                            <Input placeholder="ABC123DE" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Check Status
                    </Button>
                    </form>
                </Form>

                {clientInfo && (
                    <div className="mt-8 pt-6 border-t border-border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-primary">Membership Details</h3>
                             <Badge className={cn(clientInfo.isActive ? "bg-green-500" : "bg-red-500", "text-white")}>
                                {clientInfo.isActive ? "Active" : "Expired"}
                            </Badge>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>{clientInfo.fullName}</span></div>
                            <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> <span>Plan: {clientInfo.plan}</span></div>
                            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Expires: {clientInfo.endDate ? format(clientInfo.endDate.toDate(), 'PPP') : 'N/A'}</span></div>
                             {clientInfo.isActive && (
                                <div className={cn("flex items-center gap-3 font-medium", getDaysLeftColor(clientInfo.daysLeft))}>
                                    <Clock className="h-4 w-4" /> 
                                    <span>{clientInfo.daysLeft} days remaining</span>
                                </div>
                             )}
                        </div>
                        
                        {clientInfo.currentGoalTitle && (
                            <>
                                <Separator className="my-6" />
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Current Goal
                                    </h3>
                                    <div className="p-4 rounded-md bg-muted/50 border space-y-2">
                                        <p className="font-bold text-base text-foreground">{clientInfo.currentGoalTitle}</p>
                                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                                            <span>{clientInfo.targetMetric}: <span className="font-medium text-foreground">{clientInfo.targetValue}</span></span>
                                            {clientInfo.targetDate && <span>Target: <span className="font-medium text-foreground">{format(clientInfo.targetDate.toDate(), 'PPP')}</span></span>}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
                </CardContent>
            </Card>
        </main>
        <Footer />
    </div>
  );
};

export default MembershipPage;
