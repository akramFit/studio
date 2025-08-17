
"use client";

import React from 'react';
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
import { Trash2, Edit, PlusCircle, Loader2, RefreshCw, Star } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';


const planSchema = z.object({
  name: z.string().min(2, "Name is required."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  durationDays: z.coerce.number().int().min(1, "Duration must be at least 1 day."),
  features: z.string().min(10, "Features description is too short."),
  mostPopular: z.boolean().default(false).optional(),
});

interface Plan extends z.infer<typeof planSchema> {
  id: string;
  features: string[];
}

const PricingPage = () => {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof planSchema>>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", price: 0, durationDays: 30, features: "", mostPopular: false },
  });

  const fetchPlans = React.useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "pricing"), orderBy("durationDays"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => {
          const docData = doc.data();
          return {
              id: doc.id,
              ...docData,
              features: Array.isArray(docData.features) ? docData.features : [],
          } as Plan
      });
      setPlans(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch pricing plans.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    form.reset({ ...plan, features: plan.features.join('\n') });
    setIsDialogOpen(true);
  };
  
  const openNewDialog = () => {
    setEditingPlan(null);
    form.reset({ name: "", price: 0, durationDays: 30, features: "", mostPopular: false });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof planSchema>) => {
    setIsSubmitting(true);
    const planData = {
        ...values,
        features: values.features.split('\n').filter(f => f.trim() !== '')
    };
    try {
      if (editingPlan) {
        const docRef = doc(db, 'pricing', editingPlan.id);
        await updateDoc(docRef, planData);
        toast({ title: 'Success', description: 'Plan updated.' });
      } else {
        await addDoc(collection(db, 'pricing'), planData);
        toast({ title: 'Success', description: 'Plan added.' });
      }
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'pricing', id));
        toast({ title: 'Success', description: 'Plan deleted.' });
        fetchPlans();
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete plan.', variant: 'destructive' });
    }
  };
  
  const DZD_TO_USD_RATE = 1 / 135;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pricing Plans</CardTitle>
              <CardDescription>Manage your coaching packages.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openNewDialog}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add New Plan
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingPlan ? 'Edit' : 'Add'} Plan</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem><FormLabel>Price (DZD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="durationDays" render={({ field }) => (
                                    <FormItem><FormLabel>Duration (Days)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="features" render={({ field }) => (
                                    <FormItem><FormLabel>Features (one per line)</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="mostPopular" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <div className="space-y-0.5">
                                        <FormLabel>Most Popular</FormLabel>
                                        <CardDescription>Highlight this plan on the landing page.</CardDescription>
                                      </div>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                        />
                                      </FormControl>
                                    </FormItem>
                                )}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Save Plan
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Button onClick={fetchPlans} variant="outline" size="icon" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
          <div className="space-y-4">
            {plans.map(p => {
              const usdPrice = Math.round(p.price * DZD_TO_USD_RATE);
              return (
                <div key={p.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {p.name}
                      {p.mostPopular && <Badge variant="default" className="bg-accent text-accent-foreground"><Star className="mr-1 h-3 w-3" /> Most Popular</Badge>}
                    </h3>
                     <p className="font-semibold text-muted-foreground mt-1">
                      {p.price} DZD <span className="text-sm font-normal text-muted-foreground">(approx. ${usdPrice} USD)</span>
                      <span className="font-normal text-muted-foreground text-sm ml-2">({p.durationDays} days)</span>
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                        {p.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)}><Edit className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricingPage;
