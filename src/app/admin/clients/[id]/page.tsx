
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, User, Phone, Calendar, Dumbbell, ShieldAlert, Target } from 'lucide-react';
import ProgramGenerator from '@/components/admin/ProgramGenerator';
import { format } from 'date-fns';
import GoalManager from '@/components/admin/GoalManager';
import ProgressLog from '@/components/admin/ProgressLog';

export interface Client {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    plan: string;
    startDate: any;
    endDate: any;
    primaryGoal: string;
    notes: string;
    // Goal fields
    currentGoalTitle?: string;
    targetMetric?: string;
    targetValue?: string;
    targetDate?: any;
}

const ClientDetailPage = () => {
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const fetchClient = useCallback(async (forceRefresh = false) => {
        if (!id) return;
        if (!forceRefresh) {
            setLoading(true);
        }
        try {
            const docRef = doc(db, 'clients', id as string);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setClient({ id: docSnap.id, ...docSnap.data() } as Client);
            } else {
                toast({ title: 'Error', description: 'Client not found.', variant: 'destructive' });
                router.push('/admin/clients');
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to fetch client data.', variant: 'destructive' });
        } finally {
            if (!forceRefresh) {
                setLoading(false);
            }
        }
    }, [id, router, toast]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);
    
    const handleGoalUpdate = () => {
        fetchClient(true); // Re-fetch data without showing main loader
    };


    if (loading) {
        return (
            <div>
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1">
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-5/6" />
                            <Skeleton className="h-5 w-full" />
                        </CardContent>
                    </Card>
                    <Card className="md:col-span-2">
                        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                        <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                    </Card>
                </div>
            </div>
        );
    }
    
    if (!client) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Clients
                </Button>
                <h1 className="text-3xl font-bold">{client.fullName}</h1>
                <p className="text-muted-foreground">{client.email}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Client Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /> <span>{client.fullName}</span></div>
                        <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{client.phoneNumber}</span></div>
                        <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Plan: {client.plan}</span></div>
                        <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>Ends: {client.endDate ? format(client.endDate.toDate(), 'PPP') : 'N/A'}</span></div>
                        <div className="flex items-start gap-3"><Dumbbell className="h-4 w-4 text-muted-foreground mt-1" /> <span>Initial Goal: {client.primaryGoal.replace('_', ' ')}</span></div>
                        {client.notes && <div className="flex items-start gap-3 pt-2 border-t"><ShieldAlert className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" /> <p className="text-muted-foreground">{client.notes}</p></div>}
                    </CardContent>
                </Card>
                <div className="md:col-span-2 space-y-6">
                    <GoalManager client={client} onGoalUpdate={handleGoalUpdate} />
                    <ProgressLog clientId={client.id} />
                    {/* <ProgramGenerator client={client} /> */}
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
