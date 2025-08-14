"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, PlusCircle, Loader2, RefreshCw } from 'lucide-react';

const achievementSchema = z.object({
  title: z.string().min(2, "Title is required."),
  year: z.string().regex(/^\d{4}$/, "Must be a valid year."),
  description: z.string().min(10, "Description is too short."),
});

interface Achievement extends z.infer<typeof achievementSchema> {
  id: string;
}

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof achievementSchema>>({
    resolver: zodResolver(achievementSchema),
    defaultValues: { title: "", year: "", description: "" },
  });

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "achievements"), orderBy("year", "desc"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Achievement));
      setAchievements(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch achievements.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const openEditDialog = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    form.reset(achievement);
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingAchievement(null);
    form.reset({ title: "", year: "", description: "" });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof achievementSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingAchievement) {
        const docRef = doc(db, 'achievements', editingAchievement.id);
        await updateDoc(docRef, values);
        toast({ title: 'Success', description: 'Achievement updated.' });
      } else {
        await addDoc(collection(db, 'achievements'), values);
        toast({ title: 'Success', description: 'Achievement added.' });
      }
      setIsDialogOpen(false);
      fetchAchievements();
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'achievements', id));
        toast({ title: 'Success', description: 'Achievement deleted.' });
        fetchAchievements();
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete achievement.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Manage your list of accomplishments.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add New
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAchievement ? 'Edit' : 'Add'} Achievement</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="year" render={({ field }) => (
                                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Button onClick={fetchAchievements} variant="outline" size="icon" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
          <div className="space-y-4">
            {achievements.map(ach => (
              <div key={ach.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-bold">{ach.title} <span className="font-normal text-muted-foreground text-sm">({ach.year})</span></h3>
                  <p className="text-sm text-muted-foreground">{ach.description}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(ach)}><Edit className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ach.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementsPage;
