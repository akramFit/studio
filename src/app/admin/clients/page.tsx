"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, MessageSquare, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
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

interface Client {
  id: string;
  fullName: string;
  phoneNumber: string;
  plan: string;
  startDate: any;
  endDate: any;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'clients'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not fetch clients.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  
  const handleDelete = async (clientId: string, clientName: string) => {
    try {
        await deleteDoc(doc(db, 'clients', clientId));
        toast({ title: 'Success', description: `${clientName} has been removed.` });
        fetchClients();
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to remove client.', variant: 'destructive' });
    }
  };


  const getDaysLeft = (endDate: any) => {
    if (!endDate) return { text: 'N/A', color: 'bg-gray-500' };
    const days = differenceInDays(endDate.toDate(), new Date());
    if (days < 0) return { text: 'Expired', color: 'bg-red-500' };
    if (days <= 7) return { text: `${days} days left`, color: 'bg-yellow-500' };
    return { text: `${days} days left`, color: 'bg-green-500' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Active Clients</CardTitle>
            <CardDescription>Manage your current roster of athletes.</CardDescription>
          </div>
          <Button onClick={fetchClients} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length > 0 ? clients.map((client) => {
                const daysLeftInfo = getDaysLeft(client.endDate);
                return (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.fullName}</TableCell>
                    <TableCell><Badge variant="outline">{client.plan}</Badge></TableCell>
                    <TableCell>{client.endDate ? format(client.endDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                    <TableCell><Badge className={`${daysLeftInfo.color}`}>{daysLeftInfo.text}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <a href={`https://wa.me/${client.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                                <MessageSquare className="h-4 w-4 text-green-600" />
                            </Button>
                        </a>
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
                                        This will permanently remove {client.fullName} from your clients. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(client.id, client.fullName)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No active clients found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientsPage;
