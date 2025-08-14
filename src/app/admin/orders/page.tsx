"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, Loader2, RefreshCw } from 'lucide-react';
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
import { format } from 'date-fns';

interface Order {
  id: string;
  fullName: string;
  email: string;
  preferredPlan: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  [key: string]: any;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ordersData);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch orders.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleApprove = async (order: Order) => {
    setActionLoading(prev => ({ ...prev, [order.id]: true }));
    try {
        const planDetails: { [key: string]: number } = { "Monthly": 30, "3-Months": 90, "6-Months": 180 };
        const durationDays = planDetails[order.preferredPlan] || 30;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + durationDays);

        await addDoc(collection(db, 'clients'), {
            fullName: order.fullName,
            email: order.email,
            phoneNumber: order.phoneNumber,
            plan: order.preferredPlan,
            startDate: startDate,
            endDate: endDate,
            primaryGoal: order.primaryGoal,
            notes: order.injuriesOrNotes,
            createdAt: serverTimestamp(),
        });
        await deleteDoc(doc(db, 'orders', order.id));
        toast({ title: "Success", description: `${order.fullName} has been approved and moved to clients.` });
        fetchOrders();
    } catch (error) {
        toast({ title: "Error", description: "Failed to approve order.", variant: "destructive" });
    } finally {
        setActionLoading(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const handleDelete = async (orderId: string) => {
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      toast({ title: "Success", description: "Order has been deleted." });
      fetchOrders();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pending Orders</CardTitle>
            <CardDescription>Review and manage new client applications.</CardDescription>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="icon" disabled={loading}>
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
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.fullName}</div>
                    <div className="text-sm text-muted-foreground">{order.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.preferredPlan}</Badge>
                  </TableCell>
                  <TableCell>
                     {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => handleApprove(order)} disabled={actionLoading[order.id]}>
                        {actionLoading[order.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" disabled={actionLoading[order.id]}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This will permanently delete the order for {order.fullName}. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(order.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No pending orders found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersPage;
