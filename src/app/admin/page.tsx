"use client";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pendingOrders: 0, activeClients: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordersQuery = query(collection(db, "orders"), where("status", "==", "pending"));
        const clientsQuery = collection(db, "clients");

        const [ordersSnapshot, clientsSnapshot] = await Promise.all([
          getDocs(ordersQuery),
          getDocs(clientsQuery),
        ]);
        
        setStats({
          pendingOrders: ordersSnapshot.size,
          activeClients: clientsSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.displayName || user?.email}!</h1>
      <p className="text-muted-foreground mb-8">Here's a snapshot of your coaching business.</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">New applications to review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.activeClients}</div>
            <p className="text-xs text-muted-foreground">Currently training</p>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AdminDashboard;
