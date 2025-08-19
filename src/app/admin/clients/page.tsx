
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Trash2, MessageSquare, Loader2, RefreshCw, Copy, CalendarPlus, PauseCircle, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays, add } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  fullName: string;
  phoneNumber: string;
  plan: string;
  startDate: any;
  endDate: any;
  membershipCode?: string;
  status: 'active' | 'paused';
  daysLeftOnPause?: number;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [daysToAdd, setDaysToAdd] = useState<number>(0);
  const [isAddDaysDialogOpen, setIsAddDaysDialogOpen] = useState(false);
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

  const handleAddDays = async () => {
    if (!selectedClient || daysToAdd <= 0) {
        toast({ title: 'Invalid Input', description: 'Please select a client and enter a valid number of days.', variant: 'destructive' });
        return;
    }
    try {
        const clientRef = doc(db, 'clients', selectedClient.id);
        const currentEndDate = selectedClient.endDate.toDate();
        const newEndDate = add(currentEndDate, { days: daysToAdd });
        
        await updateDoc(clientRef, { endDate: newEndDate });
        
        toast({ title: 'Success', description: `${daysToAdd} days added to ${selectedClient.fullName}'s membership.` });
        setIsAddDaysDialogOpen(false);
        setDaysToAdd(0);
        setSelectedClient(null);
        fetchClients();
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to extend membership.', variant: 'destructive' });
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Membership code copied to clipboard." });
  };


  const getDaysLeft = (client: Client) => {
    if (client.status === 'paused') return { text: 'Paused', color: 'bg-gray-500' };
    if (!client.endDate) return { text: 'N/A', color: 'bg-gray-500' };
    
    const days = differenceInDays(client.endDate.toDate(), new Date());

    if (days < 0) return { text: 'Expired', color: 'bg-red-500' };
    if (days < 10) return { text: `${days} days left`, color: 'bg-red-500' };
    if (days < 20) return { text: `${days} days left`, color: 'bg-yellow-500' };
    return { text: `${days} days left`, color: 'bg-green-500' };
  };
  
  const openAddDaysDialog = (client: Client) => {
    setSelectedClient(client);
    setIsAddDaysDialogOpen(true);
  };
  
  const handleStatusToggle = async (client: Client) => {
    const clientRef = doc(db, 'clients', client.id);
    if (client.status === 'active') {
      // Pause the membership
      const daysLeft = differenceInDays(client.endDate.toDate(), new Date());
      try {
        await updateDoc(clientRef, {
          status: 'paused',
          daysLeftOnPause: daysLeft > 0 ? daysLeft : 0,
        });
        toast({ title: 'Membership Paused', description: `${client.fullName}'s membership has been paused.` });
        fetchClients();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to pause membership.', variant: 'destructive' });
      }
    } else {
      // Resume the membership
      const newEndDate = add(new Date(), { days: client.daysLeftOnPause || 0 });
      try {
        await updateDoc(clientRef, {
          status: 'active',
          endDate: newEndDate,
          daysLeftOnPause: 0,
        });
        toast({ title: 'Membership Resumed', description: `${client.fullName}'s membership is now active.` });
        fetchClients();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to resume membership.', variant: 'destructive' });
      }
    }
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
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length > 0 ? clients.map((client) => {
                  const daysLeftInfo = getDaysLeft(client);
                  const isActive = client.status === 'active';
                  return (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.fullName}
                        {client.membershipCode && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{client.membershipCode}</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => copyToClipboard(client.membershipCode!)}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Copy Code</p></TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{client.plan}</Badge></TableCell>
                      <TableCell>{client.endDate ? format(client.endDate.toDate(), 'PPP') : 'N/A'}</TableCell>
                      <TableCell><Badge className={`${daysLeftInfo.color}`}>{daysLeftInfo.text}</Badge></TableCell>
                      <TableCell>
                        <Tooltip>
                           <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                     <Switch
                                        checked={isActive}
                                        onCheckedChange={() => handleStatusToggle(client)}
                                        aria-readonly
                                    />
                                    <span className={cn("text-sm font-medium", isActive ? "text-green-500" : "text-gray-500")}>
                                        {isActive ? 'Active' : 'Paused'}
                                    </span>
                                </div>
                           </TooltipTrigger>
                           <TooltipContent><p>{isActive ? "Click to pause membership" : "Click to resume membership"}</p></TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                           <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                                      <Eye className="h-4 w-4" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>View Details</p></TooltipContent>
                           </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => openAddDaysDialog(client)}>
                                        <CalendarPlus className="h-4 w-4 text-blue-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Extend Membership</p></TooltipContent>
                            </Tooltip>
                           <Tooltip>
                             <TooltipTrigger asChild>
                                <a href={`https://wa.me/${client.phoneNumber.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="ghost">
                                        <MessageSquare className="h-4 w-4 text-green-600" />
                                    </Button>
                                </a>
                             </TooltipTrigger>
                             <TooltipContent><p>Contact on WhatsApp</p></TooltipContent>
                           </Tooltip>
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
                    <TableCell colSpan={6} className="text-center">No active clients found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
             <Dialog open={isAddDaysDialogOpen} onOpenChange={setIsAddDaysDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extend Membership for {selectedClient?.fullName}</DialogTitle>
                        <DialogDescription>
                            Enter the number of days to add to the current plan. The current plan expires on {selectedClient?.endDate ? format(selectedClient.endDate.toDate(), 'PPP') : 'N/A'}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="days" className="text-right">
                                Days to Add
                            </Label>
                            <Input
                                id="days"
                                type="number"
                                value={daysToAdd}
                                onChange={(e) => setDaysToAdd(parseInt(e.target.value, 10) || 0)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDaysDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddDays}>Add Days</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default ClientsPage;
