
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle, Loader2, RefreshCw, Tag, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const promoCodeSchema = z.object({
  code: z.string().min(4, "Code must be at least 4 characters.").max(20, "Code is too long."),
  discountPercentage: z.coerce.number().int().min(1, "Discount must be at least 1%.").max(100, "Discount cannot exceed 100%."),
});

interface PromoCode extends z.infer<typeof promoCodeSchema> {
  id: string;
  status: 'active' | 'used';
  createdAt: any;
  usedByOrderId?: string;
  usedAt?: any;
}

const PromoCodesPage = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof promoCodeSchema>>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: { code: "", discountPercentage: 10 },
  });

  const fetchPromoCodes = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "promoCodes"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
      setPromoCodes(items);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch promo codes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);
  
  const generateRandomCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    form.setValue('code', `AKRAM${randomPart}`);
  };

  const onSubmit = async (values: z.infer<typeof promoCodeSchema>) => {
    setIsSubmitting(true);
    try {
        const codeRef = doc(db, 'promoCodes', values.code.toUpperCase());
        const docSnap = await getDoc(codeRef);
        if (docSnap.exists()) {
            form.setError('code', { type: 'manual', message: 'This code already exists.' });
            setIsSubmitting(false);
            return;
        }

      await addDoc(collection(db, 'promoCodes'), {
        code: values.code.toUpperCase(),
        discountPercentage: values.discountPercentage,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Promo code created.' });
      setIsDialogOpen(false);
      form.reset({ code: "", discountPercentage: 10 });
      fetchPromoCodes();
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'promoCodes', id));
      toast({ title: 'Success', description: 'Promo code deleted successfully.' });
      fetchPromoCodes();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete promo code.', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Promo code copied to clipboard." });
  };


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Promo Codes</CardTitle>
            <CardDescription>Manage your promotional discount codes.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4"/> Create Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Promo Code</DialogTitle>
                  <DialogDescription>
                    Create a unique code to offer discounts to your clients.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField control={form.control} name="code" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Promo Code</FormLabel>
                            <div className="flex gap-2">
                                <FormControl><Input placeholder="e.g., SUMMERFIT20" {...field} className="uppercase" /></FormControl>
                                <Button type="button" variant="outline" onClick={generateRandomCode}>Generate</Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="discountPercentage" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Discount Percentage</FormLabel>
                            <div className="relative">
                                <FormControl><Input type="number" placeholder="e.g., 15" {...field} /></FormControl>
                                <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create
                        </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button onClick={fetchPromoCodes} variant="outline" size="icon" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
             <TooltipProvider>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promoCodes.length > 0 ? promoCodes.map((code) => (
                            <TableRow key={code.id}>
                                <TableCell className="font-medium flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <span>{code.code}</span>
                                     <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(code.code)}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Copy Code</p></TooltipContent>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{code.discountPercentage}%</TableCell>
                                <TableCell>
                                    <Badge variant={code.status === 'active' ? 'default' : 'secondary'} className={code.status === 'active' ? 'bg-green-500/80' : ''}>
                                        {code.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{code.createdAt ? format(code.createdAt.toDate(), 'PPP') : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="ghost">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the promo code <span className="font-bold">{code.code}</span>. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(code.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                           <TableRow>
                                <TableCell colSpan={5} className="text-center">No promo codes found.</TableCell>
                           </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default PromoCodesPage;
