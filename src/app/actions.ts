
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, Timestamp, writeBatch, serverTimestamp, runTransaction } from 'firebase/firestore';

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

        const promoData = docSnap.data();

        if (promoData.status !== 'active') {
            return { success: false, message: 'This promo code has already been used.' };
        }
        
        // Return a plain object with only the necessary, serializable fields
        const safePromoCode = {
            id: docSnap.id,
            code: promoData.code,
            discountPercentage: promoData.discountPercentage,
            status: promoData.status,
        };

        return { success: true, promoCode: safePromoCode, message: `Applied ${safePromoCode.discountPercentage}% discount.` };

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

        await runTransaction(db, async (transaction) => {
            const orderRef = doc(collection(db, 'orders'));

            // If a promo code is used, validate it and update its status within the transaction
            if (validatedData.promoCode) {
                const promoRef = doc(db, 'promoCodes', validatedData.promoCode.toUpperCase());
                const promoDoc = await transaction.get(promoRef);

                if (!promoDoc.exists()) {
                    throw new Error("Promo code does not exist.");
                }

                if (promoDoc.data().status !== 'active') {
                    throw new Error("Promo code has already been used.");
                }

                // Update the promo code status to 'used'
                transaction.update(promoRef, {
                    status: 'used',
                    usedByOrderId: orderRef.id,
                    usedAt: serverTimestamp(),
                });
            }

            // Create the order
            transaction.set(orderRef, {
                ...validatedData,
                status: 'pending',
                createdAt: serverTimestamp(),
            });
        });

        return { success: true, message: "Application Sent! Akram will review it shortly." };

    } catch (error: any) {
        console.error("Error creating subscription order:", error);
        if (error instanceof z.ZodError) {
            return { success: false, message: "Invalid form data provided." };
        }
        // Check for our custom promo code error messages
        if (error.message.includes("Promo code")) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Something went wrong. Please try again." };
    }
}
