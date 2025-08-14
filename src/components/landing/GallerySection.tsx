"use client";

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface GalleryItem {
  id: string;
  imageURL: string;
  caption: string;
}

const GallerySection = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const galleryCollection = collection(db, 'gallery');
        const q = query(galleryCollection, where('visible', '==', true), orderBy('position'));
        const querySnapshot = await getDocs(q);
        const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
        setGalleryItems(itemsData);
      } catch (error) {
        console.error("Error fetching gallery data: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <section id="gallery" className="py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Client Transformations & Gallery</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Real clients, real results. A showcase of dedication and hard work.</p>
        </div>
        
        {loading ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="w-full h-64 mb-4 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {galleryItems.map(item => (
              <div key={item.id} className="overflow-hidden rounded-lg shadow-lg group relative break-inside-avoid">
                <Image
                  src={item.imageURL || 'https://placehold.co/600x400.png'}
                  alt={item.caption || 'Gallery image'}
                  width={600}
                  height={800}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                  data-ai-hint="fitness transformation"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <p className="absolute bottom-0 left-0 p-4 text-white text-sm font-medium">{item.caption}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
