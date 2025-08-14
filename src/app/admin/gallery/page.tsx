"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Upload, Trash2, Edit, Save, X, Loader2, RefreshCw } from 'lucide-react';

interface GalleryItem {
  id: string;
  imageURL: string;
  imagePath: string;
  caption: string;
  position: number;
  visible: boolean;
}

const GalleryPage = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const { toast } = useToast();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const imagePath = `gallery/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, imagePath);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const imageURL = await getDownloadURL(snapshot.ref);
      
      await addDoc(collection(db, 'gallery'), {
        imageURL,
        imagePath,
        caption: 'New Image',
        visible: true,
        position: galleryItems.length,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Image uploaded successfully.' });
      fetchGallery();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload image.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    const { id, imagePath } = item;
    const storageRef = ref(storage, imagePath);
    try {
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'gallery', id));
      toast({ title: 'Success', description: 'Image deleted successfully.' });
      fetchGallery();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete image.', variant: 'destructive' });
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItemId(item.id);
    setEditedCaption(item.caption);
  };

  const handleSave = async (id: string) => {
    const itemDoc = doc(db, 'gallery', id);
    try {
        await updateDoc(itemDoc, { caption: editedCaption });
        toast({ title: 'Success', description: 'Caption updated.' });
        setEditingItemId(null);
        fetchGallery();
    } catch(error) {
        toast({ title: 'Error', description: 'Failed to update caption.', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gallery Management</CardTitle>
            <CardDescription>Upload, edit, and remove gallery images.</CardDescription>
          </div>
          <div className="flex gap-2 items-center">
            <Button asChild variant="default" disabled={uploading}>
              <label>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading}/>
              </label>
            </Button>
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
                <div className="p-4 bg-white">
                  {editingItemId === item.id ? (
                    <div className="flex items-center gap-2">
                      <Input value={editedCaption} onChange={(e) => setEditedCaption(e.target.value)} className="h-8" />
                      <Button size="icon" variant="ghost" onClick={() => handleSave(item.id)}><Save className="h-4 w-4 text-green-600" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingItemId(null)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{item.caption}</p>
                        <div className="flex items-center">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(item)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    </div>
                  )}
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
