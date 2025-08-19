
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { BookMarked, Loader2, MessageSquarePlus, TrendingUp, TrendingDown, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';


const logSchema = z.object({
  note: z.string().min(5, "Note must be at least 5 characters.").max(500),
  category: z.enum(['progress', 'setback', 'health', 'general']),
});

interface LogEntry extends z.infer<typeof logSchema> {
  id: string;
  createdAt: any;
}

interface ProgressLogProps {
  clientId: string;
}

const categoryConfig = {
    progress: { label: 'Progress', icon: TrendingUp, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    setback: { label: 'Setback', icon: TrendingDown, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    health: { label: 'Health', icon: ShieldQuestion, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    general: { label: 'General', icon: MessageSquarePlus, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};


const ProgressLog = ({ clientId }: ProgressLogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof logSchema>>({
    resolver: zodResolver(logSchema),
    defaultValues: { note: '', category: 'general' },
  });

  useEffect(() => {
    const q = query(collection(db, 'clients', clientId, 'progressLogs'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogEntry));
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching progress logs:", error);
      toast({ title: "Error", description: "Could not fetch progress logs.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clientId, toast]);

  const onSubmit = async (values: z.infer<typeof logSchema>) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'clients', clientId, 'progressLogs'), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: "Log entry added." });
      form.reset();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add log entry.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          Progress Log
        </CardTitle>
        <CardDescription>Track client updates, milestones, and setbacks over time.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-6">
            <FormField control={form.control} name="note" render={({ field }) => (
              <FormItem><FormLabel>New Log Entry</FormLabel><FormControl><Textarea placeholder="e.g., Client hit a new PR on squats..." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="flex justify-between items-end gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem className="flex-1"><FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.entries(categoryConfig).map(([key, {label}]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    <FormMessage />
                    </FormItem>
                )}/>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Add Entry
                </Button>
            </div>
          </form>
        </Form>
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground">History</h4>
          {loading ? (
             <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : logs.length > 0 ? (
            <ScrollArea className="h-72 pr-4">
                <div className="space-y-4">
                {logs.map(log => {
                    const config = categoryConfig[log.category as keyof typeof categoryConfig];
                    const Icon = config.icon;
                    return (
                        <div key={log.id} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border", config.color)}>
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="h-full min-h-10 w-px bg-border my-1"></div>
                            </div>
                            <div className="flex-1 pb-4">
                               <div className="flex items-center justify-between">
                                 <Badge variant="outline" className={cn("border", config.color)}>{config.label}</Badge>
                                 <p className="text-xs text-muted-foreground">
                                    {log.createdAt ? format(log.createdAt.toDate(), 'PPP') : '...'}
                                 </p>
                               </div>
                                <p className="text-sm text-foreground mt-2">{log.note}</p>
                            </div>
                        </div>
                    );
                })}
                </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No log entries have been added for this client yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressLog;
