
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
import { Loader2, User, Calendar, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const formSchema = z.object({
  membershipCode: z.string().min(6, "Membership code is required."),
});

interface Client {
    fullName: string;
    plan: string;
    endDate: any;
}

const MembershipPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      membershipCode: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setClient(null);
    try {
      const q = query(collection(db, 'clients'), where('membershipCode', '==', values.membershipCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ title: 'Not Found', description: 'No active membership found with that code.', variant: 'destructive' });
      } else {
        const clientData = querySnapshot.docs[0].data() as Client;
        setClient(clientData);
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

                {client && (
                    <div className="mt-8 pt-6 border-t border-border">
                        <h3 className="text-lg font-semibold text-center mb-4 text-primary">Membership Details</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>{client.fullName}</span></div>
                            <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-muted-foreground" /> <span>Plan: {client.plan}</span></div>
                            <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Expires: {client.endDate ? format(client.endDate.toDate(), 'PPP') : 'N/A'}</span></div>
                        </div>
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
