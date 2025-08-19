
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Client } from '@/app/admin/clients/[id]/page';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Target, CalendarIcon, Edit, Loader2 } from 'lucide-react';

const goalSchema = z.object({
  currentGoalTitle: z.string().min(3, "Goal title is required.").max(50),
  targetMetric: z.string().min(2, "Target metric is required.").max(50),
  targetValue: z.string().min(1, "Target value is required.").max(20),
  targetDate: z.date({ required_error: "A target date is required." }),
});

interface GoalManagerProps {
  client: Client;
  onGoalUpdate: () => void;
}

const GoalManager = ({ client, onGoalUpdate }: GoalManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      currentGoalTitle: client.currentGoalTitle || '',
      targetMetric: client.targetMetric || '',
      targetValue: client.targetValue || '',
      targetDate: client.targetDate ? client.targetDate.toDate() : undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof goalSchema>) => {
    setIsSubmitting(true);
    try {
      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, values);
      toast({ title: "Success", description: "Client's goal has been updated." });
      onGoalUpdate();
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update goal.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Current Goal
          </CardTitle>
          <CardDescription>The primary objective the client is working towards.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              {client.currentGoalTitle ? 'Edit Goal' : 'Set Goal'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{client.currentGoalTitle ? 'Edit' : 'Set'} Client Goal</DialogTitle>
              <DialogDescription>Define a clear, measurable goal for {client.fullName}.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="currentGoalTitle" render={({ field }) => (
                  <FormItem><FormLabel>Goal Title</FormLabel><FormControl><Input placeholder="e.g., Competition Prep" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="targetMetric" render={({ field }) => (
                        <FormItem><FormLabel>Target Metric</FormLabel><FormControl><Input placeholder="e.g., Body Weight" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="targetValue" render={({ field }) => (
                        <FormItem><FormLabel>Target Value</FormLabel><FormControl><Input placeholder="e.g., 85 kg" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <FormField control={form.control} name="targetDate" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Target Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? (format(field.value, "PPP")) : (<span>Pick a date</span>)}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                            </PopoverContent>
                        </Popover>
                    <FormMessage />
                    </FormItem>
                )}/>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Goal
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {client.currentGoalTitle ? (
            <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-lg text-foreground">{client.currentGoalTitle}</h3>
                <div className="flex justify-between items-center text-muted-foreground border-t pt-2">
                    <span>{client.targetMetric}: <span className="font-bold text-foreground">{client.targetValue}</span></span>
                    <span>Target: <span className="font-bold text-foreground">{client.targetDate ? format(client.targetDate.toDate(), 'PPP') : 'N/A'}</span></span>
                </div>
            </div>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No specific goal has been set for this client yet.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GoalManager;
