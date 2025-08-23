
"use client";

import React, antd from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, writeBatch, orderBy } from 'firebase/firestore';
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
import { format, addMonths } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Order {
  id: string;
  fullName: string;
  email: string;
  preferredPlan: string;
  subscriptionDuration: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  finalPrice?: number;
  [key: string]: any;
}

const OrdersPage = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      // Removed the orderBy clause to prevent index-related errors
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

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleApprove = async (order: Order) => {
    setActionLoading(prev => ({ ...prev, [order.id]: true }));
    try {
        const batch = writeBatch(db);

        const durationMonths = order.subscriptionDuration || 1;
        const startDate = new Date();
        const endDate = addMonths(startDate, durationMonths);

        const newClientRef = doc(collection(db, 'clients'));
        batch.set(newClientRef, {
            fullName: order.fullName,
            email: order.email,
            phoneNumber: order.phoneNumber,
            plan: order.preferredPlan,
            startDate: startDate,
            endDate: endDate,
            primaryGoal: order.primaryGoal,
            notes: order.injuriesOrNotes,
            createdAt: serverTimestamp(),
            status: 'active',
            membershipCode: newClientRef.id.substring(0, 8).toUpperCase(),
        });

        // Add to transactions for financial tracking
        if (order.finalPrice && order.finalPrice > 0) {
            const transactionRef = doc(collection(db, 'transactions'));
            batch.set(transactionRef, {
                description: `Subscription: ${order.fullName}`,
                amount: order.finalPrice,
                date: serverTimestamp(),
                clientId: newClient_ref.id,
            });
        }
        
        // Delete the original order
        const orderRef = doc(db, 'orders', order.id);
        batch.delete(orderRef);
        
        await batch.commit();

        toast({ title: "Success", description: `${order.fullName} has been approved and moved to clients.` });
        fetchOrders();
    } catch (error) {
        console.error("Approval error:", error);
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
  
  const getDurationText = (months: number) => {
    if (months === 12) return "1 Year";
    if (months === 1) return "1 Month";
    return `${months} Months`;
  }
  
  const SkeletonTable = () => (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Final Price</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
          <SkeletonTable />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Final Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.fullName}</div>
                    <div className="text-sm text-muted-foreground">{order.createdAt ? format(order.createdAt.toDate(), 'PPP') : ''}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.preferredPlan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getDurationText(order.subscriptionDuration)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.finalPrice ? `${order.finalPrice.toLocaleString()} DZD` : 'N/A'}
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
                  <TableCell colSpan={5} className="text-center">No pending orders found.</TableCell>
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
