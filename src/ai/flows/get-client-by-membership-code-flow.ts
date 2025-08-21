
'use server';
/**
 * @fileOverview A secure flow to fetch client details and their schedule by membership code.
 *
 * - getClientByMembershipCode - Fetches client data for the public membership page.
 * - GetClientInput - The input type for the flow.
 * - GetClientOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { run } from 'genkit';
import { defineFlow, forceDevAuthPolicy } from '@genkit-ai/next';

const GetClientInputSchema = z.object({
  membershipCode: z.string().describe('The unique membership code for the client.'),
});
export type GetClientInput = z.infer<typeof GetClientInputSchema>;

const ClientScheduleSchema = z.object({
    day: z.string(),
    time: z.string(),
});

const GetClientOutputSchema = z.object({
    found: z.boolean(),
    fullName: z.string().optional(),
    plan: z.string().optional(),
    endDate: z.string().optional(), // Send as ISO string
    status: z.enum(['active', 'paused']).optional(),
    currentGoalTitle: z.string().optional(),
    targetMetric: z.string().optional(),
    targetValue: z.string().optional(),
    targetDate: z.string().optional(), // Send as ISO string
    schedule: z.array(ClientScheduleSchema).optional(),
}).nullable();

export type GetClientOutput = z.infer<typeof GetClientOutputSchema>;

export async function getClientByMembershipCode(input: GetClientInput): Promise<GetClientOutput> {
  return getClientByMembershipCodeFlow(input);
}

const getClientByMembershipCodeFlow = defineFlow(
  {
    name: 'getClientByMembershipCodeFlow',
    inputSchema: GetClientInputSchema,
    outputSchema: GetClientOutputSchema,
    authPolicy: forceDevAuthPolicy, // Allow public access to this flow
  },
  async ({ membershipCode }) => {
     // Use run() to execute this logic with elevated (admin) privileges on the server
     return await run('fetch-client-data', async () => {
        if (!membershipCode) {
            return { found: false };
        }

        // 1. Find the client by membership code
        const clientQuery = query(collection(db, 'clients'), where('membershipCode', '==', membershipCode.toUpperCase()));
        const clientSnapshot = await getDocs(clientQuery);

        if (clientSnapshot.empty) {
        return { found: false };
        }

        const clientDoc = clientSnapshot.docs[0];
        const clientData = clientDoc.data();
        const clientId = clientDoc.id;

        // 2. Fetch the weekly schedule to find this client's sessions
        const scheduleDocRef = doc(db, 'app-data', 'weeklySchedule');
        const scheduleDocSnap = await getDoc(scheduleDocRef);
        let clientSchedule: z.infer<typeof ClientScheduleSchema>[] = [];

        if (scheduleDocSnap.exists()) {
        const scheduleData = scheduleDocSnap.data().schedule;
        for (const day in scheduleData) {
            for (const time in scheduleData[day]) {
            if (scheduleData[day][time] === clientId) {
                clientSchedule.push({ day, time });
            }
            }
        }
        }
        
        // Convert Timestamps to ISO strings for serialization
        const endDate = clientData.endDate instanceof Timestamp ? clientData.endDate.toDate().toISOString() : undefined;
        const targetDate = clientData.targetDate instanceof Timestamp ? clientData.targetDate.toDate().toISOString() : undefined;


        return {
        found: true,
        fullName: clientData.fullName,
        plan: clientData.plan,
        endDate: endDate,
        status: clientData.status || 'active',
        currentGoalTitle: clientData.currentGoalTitle,
        targetMetric: clientData.targetMetric,
        targetValue: clientData.targetValue,
        targetDate: targetDate,
        schedule: clientSchedule,
        };
    });
  }
);
