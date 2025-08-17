
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Trash2, Edit, PlusCircle, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const galleryItemSchema = z.object({
  imageURL: z.string().url("Please enter a valid URL."),
  caption: z.string().min(2, "Caption is required."),
});

interface GalleryItem extends z.infer<typeof galleryItemSchema> {
  id: string;
  position: number;
}

const GalleryPage = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof galleryItemSchema>>({
    resolver: zodResolver(galleryItemSchema),
    defaultValues: { imageURL: "", caption: "" },
  });

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "gallery"), orderBy("position"));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
      setGalleryItems(items);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch gallery items.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const openEditDialog = (item: GalleryItem) => {
    setEditingItem(item);
    form.reset(item);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    form.reset({ imageURL: "", caption: "" });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof galleryItemSchema>) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const docRef = doc(db, 'gallery', editingItem.id);
        await updateDoc(docRef, values);
        toast({ title: 'Success', description: 'Gallery item updated.' });
      } else {
        await addDoc(collection(db, 'gallery'), {
          ...values,
          visible: true,
          position: galleryItems.length,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Image added to gallery.' });
      }
      setIsDialogOpen(false);
      fetchGallery();
    } catch (error) {
      toast({ title: 'Error', description: 'An error occurred.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'gallery', id));
      toast({ title: 'Success', description: 'Image deleted successfully.' });
      fetchGallery();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete image.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gallery Management</CardTitle>
            <CardDescription>Add, edit, and remove gallery images using URLs.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit' : 'Add'} Image</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="imageURL" render={({ field }) => (
                        <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="caption" render={({ field }) => (
                        <FormItem><FormLabel>Caption</FormLabel><FormControl><Textarea placeholder="Enter a descriptive caption..." {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            <Button onClick={fetchGallery} variant="outline" size="icon" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryItems.map(item => (
                <div key={item.id} className="group relative border rounded-lg overflow-hidden shadow">
                <Image src={item.imageURL} alt={item.caption} width={400} height={400} className="object-cover w-full h-60" />
                <div className="p-4 bg-card">
                  <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate pr-2">{item.caption}</p>
                      <div className="flex items-center">
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                  </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryPage;
