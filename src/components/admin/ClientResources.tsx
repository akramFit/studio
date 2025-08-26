
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Link as LinkIcon, Loader2 } from 'lucide-react';

const resourcesSchema = z.object({
  nutritionPlanUrl: z.string().url("Please enter a valid URL.").or(z.literal('')),
  trainingProgramUrl: z.string().url("Please enter a valid URL.").or(z.literal('')),
});

interface ClientResourcesProps {
  client: Client;
  onUpdate: () => void;
}

const ClientResources = ({ client, onUpdate }: ClientResourcesProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof resourcesSchema>>({
    resolver: zodResolver(resourcesSchema),
    defaultValues: {
      nutritionPlanUrl: client.nutritionPlanUrl || '',
      trainingProgramUrl: client.trainingProgramUrl || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof resourcesSchema>) => {
    setIsSubmitting(true);
    try {
      const clientRef = doc(db, 'clients', client.id);
      await updateDoc(clientRef, values);
      toast({ title: "Success", description: "Client resources have been updated." });
      onUpdate();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update resources.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Client Resources
            </CardTitle>
            <CardDescription>Add links to the client's nutrition and training plans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nutritionPlanUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nutrition Plan URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-link-here.com/nutrition" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trainingProgramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Program URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-link-here.com/training" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Links
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ClientResources;
