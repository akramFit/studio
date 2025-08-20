
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: string;
  fullName: string;
}

type ScheduleData = Record<string, Record<string, string>>;

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`); // 8 AM to 8 PM

const SchedulePage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [schedule, setSchedule] = useState<ScheduleData>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchClientsAndSchedule = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch clients
      const clientsQuerySnapshot = await getDocs(collection(db, 'clients'));
      const clientsData = clientsQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
      setClients(clientsData);

      // Fetch schedule
      const scheduleDocRef = doc(db, 'app-data', 'weeklySchedule');
      const scheduleDocSnap = await getDoc(scheduleDocRef);
      if (scheduleDocSnap.exists()) {
        setSchedule(scheduleDocSnap.data().schedule || {});
      } else {
        // Initialize empty schedule
        const newSchedule: ScheduleData = {};
        daysOfWeek.forEach(day => {
          newSchedule[day] = {};
          timeSlots.forEach(time => {
            newSchedule[day][time] = '';
          });
        });
        setSchedule(newSchedule);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not fetch data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClientsAndSchedule();
  }, [fetchClientsAndSchedule]);

  const handleSelectChange = (day: string, time: string, clientId: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [time]: clientId === 'unassigned' ? '' : clientId,
      },
    }));
  };
  
  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
        const scheduleDocRef = doc(db, 'app-data', 'weeklySchedule');
        await setDoc(scheduleDocRef, { schedule });
        toast({ title: 'Success', description: 'Weekly schedule has been saved.' });
    } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to save schedule.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-24" />
                    {Array.from({ length: 6 }).map((_, j) => (
                        <Skeleton key={j} className="h-10 w-full" />
                    ))}
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Assign clients to their weekly training slots.</CardDescription>
          </div>
          <Button onClick={handleSaveSchedule} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] sticky left-0 bg-card">Day</TableHead>
              {timeSlots.map(time => (
                <TableHead key={time} className="text-center">{time}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {daysOfWeek.map(day => (
              <TableRow key={day}>
                <TableCell className="font-medium sticky left-0 bg-card">{day}</TableCell>
                {timeSlots.map(time => (
                  <TableCell key={time} className="p-1">
                    <Select
                      value={schedule[day]?.[time] || ''}
                      onValueChange={(value) => handleSelectChange(day, time, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Assign client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">- Unassigned -</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SchedulePage;
