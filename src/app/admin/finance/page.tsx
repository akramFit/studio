
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, DollarSign, TrendingUp, TrendingDown, PlusCircle, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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

const expenseSchema = z.object({
  description: z.string().min(2, "Description is required."),
  amount: z.coerce.number().min(0.01, "Amount must be positive."),
});

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: Timestamp;
}

const FinancePage = () => {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, netProfit: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAmountVisible, setIsAmountVisible] = useState(true);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: "", amount: 0 },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const incomeQuery = query(collection(db, "transactions"), orderBy("date", "desc"));
      const expensesQuery = query(collection(db, "expenses"), orderBy("date", "desc"));

      const [incomeSnapshot, expensesSnapshot] = await Promise.all([
        getDocs(incomeQuery),
        getDocs(expensesQuery),
      ]);

      const incomeTxs = incomeSnapshot.docs.map(doc => ({ id: doc.id, type: 'income' as const, ...doc.data() } as Transaction));
      const expenseTxs = expensesSnapshot.docs.map(doc => ({ id: doc.id, type: 'expense' as const, ...doc.data() } as Transaction));
      
      const allTxs = [...incomeTxs, ...expenseTxs].sort((a, b) => b.date.toMillis() - a.date.toMillis());
      setTransactions(allTxs);

      const totalIncome = incomeTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const totalExpenses = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const netProfit = totalIncome - totalExpenses;
      setStats({ totalIncome, totalExpenses, netProfit });
      
      // Prepare chart data
      const monthlyData: { [key: string]: { month: string; income: number; expenses: number } } = {};
      [...incomeTxs, ...expenseTxs].forEach(tx => {
        const month = format(tx.date.toDate(), 'MMM yyyy');
        if (!monthlyData[month]) {
            monthlyData[month] = { month, income: 0, expenses: 0 };
        }
        if (tx.type === 'income') monthlyData[month].income += tx.amount;
        else monthlyData[month].expenses += tx.amount;
      });
      setChartData(Object.values(monthlyData).reverse());

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not fetch financial data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onAddExpense = async (values: z.infer<typeof expenseSchema>) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        ...values,
        date: serverTimestamp(),
      });
      toast({ title: "Success", description: "Expense added." });
      setIsDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteTransaction = async (id: string, type: 'income' | 'expense') => {
    const collectionName = type === 'income' ? 'transactions' : 'expenses';
    try {
        await deleteDoc(doc(db, collectionName, id));
        toast({ title: 'Success', description: 'Transaction deleted.' });
        fetchData();
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete transaction.', variant: 'destructive' });
    }
  };

  const formatCurrency = (amount: number) => isAmountVisible ? `${amount.toLocaleString()} DZD` : '•••••• DZD';

  const SkeletonCard = () => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent><Skeleton className="h-7 w-36" /></CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold">Financial Overview</h1>
                <p className="text-muted-foreground">Track your business's financial performance.</p>
            </div>
            <div className="flex gap-2">
                 <Button onClick={() => setIsAmountVisible(!isAmountVisible)} variant="outline" size="icon">
                    {isAmountVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Expense</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add New Expense</DialogTitle></DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onAddExpense)} className="space-y-4">
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Gym Equipment" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="amount" render={({ field }) => (
                                    <FormItem><FormLabel>Amount (DZD)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Add Expense
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Button onClick={fetchData} variant="outline" size="icon" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
            {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
            ) : (
                <>
                  <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Income</CardTitle><TrendingUp className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalIncome)}</div></CardContent></Card>
                  <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenses</CardTitle><TrendingDown className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div></CardContent></Card>
                  <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Net Profit</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.netProfit)}</div></CardContent></Card>
                </>
            )}
        </div>

        <Card>
            <CardHeader><CardTitle>Income vs. Expenses</CardTitle><CardDescription>Monthly financial performance.</CardDescription></CardHeader>
            <CardContent className="h-80 w-full">
                {loading ? <Skeleton className="w-full h-full" /> : 
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => isAmountVisible ? `${value/1000}k` : '•••'} />
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            formatter={(value: number) => isAmountVisible ? `${value.toLocaleString()} DZD` : '•••••• DZD'}
                        />
                        <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                </ResponsiveContainer>
                }
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                             <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                             <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                             </TableRow>
                          ))
                        ) : 
                         transactions.length > 0 ? transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-medium">{tx.description}</TableCell>
                                <TableCell><span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tx.type}</span></TableCell>
                                <TableCell>{format(tx.date.toDate(), 'PPP')}</TableCell>
                                <TableCell className={`text-right font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(tx.amount)}</TableCell>
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
                                                    This will permanently delete the transaction: "{tx.description}". This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteTransaction(tx.id, tx.type)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                         )) : (<TableRow><TableCell colSpan={5} className="text-center">No transactions found.</TableCell></TableRow>)
                        }
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
};

export default FinancePage;
