
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, writeBatch, serverTimestamp } from 'firebase/firestore';

const GetClientInputSchema = z.object({
  membershipCode: z.string().describe('The unique membership code for the client.'),
});

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
});

export type GetClientInput = z.infer<typeof GetClientInputSchema>;
export type GetClientOutput = z.infer<typeof GetClientOutputSchema>;

export async function getClientByMembershipCode(input: GetClientInput): Promise<GetClientOutput> {
    const { membershipCode } = GetClientInputSchema.parse(input);

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
}


// --- New Server Actions for Subscription Form ---

const PromoCodeSchema = z.object({
    id: z.string(),
    code: z.string(),
    discountPercentage: z.number(),
    status: z.enum(['active', 'used']),
});
export type PromoCode = z.infer<typeof PromoCodeSchema>;

const ValidatePromoCodeOutputSchema = z.object({
    success: z.boolean(),
    promoCode: PromoCodeSchema.optional(),
    message: z.string(),
});


export async function validatePromoCode(code: string): Promise<z.infer<typeof ValidatePromoCodeOutputSchema>> {
    if (!code) {
        return { success: false, message: 'Promo code cannot be empty.' };
    }

    try {
        const promoRef = doc(db, 'promoCodes', code.toUpperCase());
        const docSnap = await getDoc(promoRef);

        if (!docSnap.exists()) {
            return { success: false, message: 'This promo code does not exist.' };
        }

        const promoData = { id: docSnap.id, ...docSnap.data() } as PromoCode;

        if (promoData.status !== 'active') {
            return { success: false, message: 'This promo code has already been used.' };
        }
        
        return { success: true, promoCode: promoData, message: `Applied ${promoData.discountPercentage}% discount.` };

    } catch (error) {
        console.error("Error validating promo code:", error);
        return { success: false, message: 'Could not validate promo code.' };
    }
}


const SubscriptionFormSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  age: z.number(),
  height: z.number(),
  weight: z.number(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  primaryGoal: z.enum(['fat_loss', 'muscle_gain', 'strength', 'other']),
  otherGoal: z.string().optional(),
  injuriesOrNotes: z.string().optional(),
  preferredPlan: z.string(),
  subscriptionDuration: z.number(),
  promoCode: z.string().optional(),
  finalPrice: z.number().nullable(),
});

export async function createSubscriptionOrder(formData: z.infer<typeof SubscriptionFormSchema>) {
    try {
        const validatedData = SubscriptionFormSchema.parse(formData);

        const batch = writeBatch(db);

        // 1. Create the order
        const orderRef = doc(collection(db, 'orders'));
        batch.set(orderRef, {
            ...validatedData,
            status: 'pending',
            createdAt: serverTimestamp(),
        });

        // 2. If a promo code was used, update its status
        if (validatedData.promoCode) {
            const promoRef = doc(db, 'promoCodes', validatedData.promoCode.toUpperCase());
            batch.update(promoRef, {
                status: 'used',
                usedByOrderId: orderRef.id,
                usedAt: serverTimestamp(),
            });
        }

        await batch.commit();

        return { success: true, message: "Application Sent! Akram will review it shortly." };
    } catch (error) {
        console.error("Error creating subscription order:", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid form data provided." };
        }
        return { success: false, message: "Something went wrong. Please try again." };
    }
}
