"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, User, Calendar, ShieldCheck, Clock, Target, PauseCircle, Link as LinkIcon, Dumbbell, Apple } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { getClientByMembershipCode } from '@/app/actions'; // Import the new Server Action
import type { GetClientOutput } from '@/app/actions'; // Import the type
import Link from 'next/link';

const formSchema = z.object({
  membershipCode: z.string().min(6, "Membership code is required."),
});

interface ClientInfo extends GetClientOutput {
    daysLeft: number;
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
      const result = await getClientByMembershipCode({ membershipCode: values.membershipCode });

      if (!result || !result.found) {
        toast({ title: 'Not Found', description: 'No membership found with that code.', variant: 'destructive' });
      } else {
        const endDate = result.endDate ? parseISO(result.endDate) : new Date();
        const daysLeft = differenceInDays(endDate, new Date());

        setClientInfo({
            ...result,
            daysLeft: daysLeft < 0 ? 0 : daysLeft,
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
  
  const getStatusInfo = (client: ClientInfo) => {
    if (client.status === 'paused') {
      return { text: 'Paused', color: 'bg-gray-500' };
    }
    if (client.daysLeft <= 0) {
      return { text: 'Expired', color: 'bg-red-500' };
    }
    return { text: 'Active', color: 'bg-green-500' };
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-lg mx-auto">
                <Card className="w-full shadow-lg bg-card">
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

                    {clientInfo && clientInfo.found && (
                        <div className="mt-8 pt-6 border-t border-border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-primary">Membership Details</h3>
                                <Badge className={cn(getStatusInfo(clientInfo).color, "text-white")}>
                                    {getStatusInfo(clientInfo).text}
                                </Badge>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>{clientInfo.fullName}</span></div>
                                <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> <span>Plan: {clientInfo.plan}</span></div>
                                <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Expires: {clientInfo.endDate ? format(parseISO(clientInfo.endDate), 'PPP') : 'N/A'}</span></div>
                                {clientInfo.status === 'active' && clientInfo.daysLeft > 0 && (
                                    <div className={cn("flex items-center gap-3 font-medium", getDaysLeftColor(clientInfo.daysLeft))}>
                                        <Clock className="h-4 w-4" /> 
                                        <span>{clientInfo.daysLeft} days remaining</span>
                                    </div>
                                )}
                                {clientInfo.status === 'paused' && (
                                    <div className="flex items-center gap-3 font-medium text-gray-400">
                                        <PauseCircle className="h-4 w-4" /> 
                                        <span>Membership is currently paused.</span>
                                    </div>
                                )}
                            </div>
                            
                            {(clientInfo.nutritionPlanUrl || clientInfo.trainingProgramUrl) && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                            <LinkIcon className="h-5 w-5" />
                                            Your Resources
                                        </h3>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {clientInfo.nutritionPlanUrl && (
                                                <Button asChild className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <Link href={clientInfo.nutritionPlanUrl} target="_blank" rel="noopener noreferrer">
                                                        <Apple className="mr-2 h-4 w-4" /> Nutrition Plan
                                                    </Link>
                                                </Button>
                                            )}
                                            {clientInfo.trainingProgramUrl && (
                                                <Button asChild className="flex-1 bg-red-600 hover:bg-red-700">
                                                    <Link href={clientInfo.trainingProgramUrl} target="_blank" rel="noopener noreferrer">
                                                        <Dumbbell className="mr-2 h-4 w-4" /> Training Program
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                            
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
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-muted-foreground gap-2 sm:gap-0">
                                                <span>{clientInfo.targetMetric}: <span className="font-medium text-foreground">{clientInfo.targetValue}</span></span>
                                                {clientInfo.targetDate && <span>Target: <span className="font-medium text-foreground">{format(parseISO(clientInfo.targetDate), 'PPP')}</span></span>}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {clientInfo.schedule && clientInfo.schedule.length > 0 && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Your Weekly Schedule
                                        </h3>
                                        <div className="p-4 rounded-md bg-muted/50 border space-y-2">
                                        {clientInfo.schedule.map((session, index) => (
                                            <div key={index} className="flex justify-between items-center text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">{session.day}</span>
                                                <span>{session.time}</span>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>
        </main>
        <Footer />
    </div>
  );
};

export default MembershipPage;
