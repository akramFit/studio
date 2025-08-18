
"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface GalleryItem {
  id: string;
  imageURL: string;
  caption: string;
  visible: boolean;
  position: number;
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
    <section id="gallery" className="py-20 md:py-32 bg-black">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-white">Gallery</h2>
          <p className="text-slate-300 mt-2 max-w-2xl mx-auto">A showcase of my personal journey and dedication to the sport.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center">
            <Skeleton className="w-full max-w-xl h-96 rounded-lg" />
          </div>
        ) : (
          <div className="flex justify-center">
            <Carousel className="w-full max-w-xl">
              <CarouselContent>
                {galleryItems.map((item) => (
                  <CarouselItem key={item.id}>
                    <div className="p-1">
                      <Card className="overflow-hidden bg-transparent border-none">
                        <CardContent className="flex flex-col aspect-square items-center justify-center p-0 relative">
                           <div className="relative group w-full h-full">
                              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                              <Image
                                src={item.imageURL || 'https://placehold.co/600x800.png'}
                                alt={item.caption || 'Gallery image'}
                                width={600}
                                height={800}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative rounded-lg"
                                data-ai-hint="bodybuilding physique"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
                              <p className="absolute bottom-4 left-4 text-white text-sm font-medium">{item.caption}</p>
                           </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
