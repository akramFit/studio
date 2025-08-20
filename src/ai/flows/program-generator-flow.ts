
'use server';
/**
 * @fileOverview An AI flow for generating personalized workout programs for clients.
 *
 * - generateProgram - A function that handles the workout program generation process.
 * - ProgramGeneratorInput - The input type for the generateProgram function.
 * - ProgramGeneratorOutput - The return type for the generateProgram function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ProgramGeneratorInputSchema = z.object({
  clientName: z.string().describe("The full name of the client."),
  primaryGoal: z.string().describe("The client's primary fitness goal (e.g., fat_loss, muscle_gain, strength)."),
  notes: z.string().optional().describe("Any specific notes about the client, such as injuries, preferences, or limitations."),
  customPrompt: z.string().describe("The full, detailed prompt from the coach to guide the AI."),
});
export type ProgramGeneratorInput = z.infer<typeof ProgramGeneratorInputSchema>;

const ProgramGeneratorOutputSchema = z.object({
  program: z.string().describe("The complete, well-formatted, and structured workout program as a single string. It should be ready to be displayed in a text area or converted to a PDF."),
});
export type ProgramGeneratorOutput = z.infer<typeof ProgramGeneratorOutputSchema>;

export async function generateProgram(input: ProgramGeneratorInput): Promise<ProgramGeneratorOutput> {
  return generateProgramFlow(input);
}

const prompt = ai.definePrompt({
  name: 'programGeneratorPrompt',
  input: { schema: ProgramGeneratorInputSchema },
  output: { schema: ProgramGeneratorOutputSchema },
  prompt: `You are an expert bodybuilding and fitness coach named Akram. Your task is to generate a detailed, high-quality, and personalized workout program based on the provided client information and a specific prompt.

  **Client Information:**
  - **Name:** {{{clientName}}}
  - **Primary Goal:** {{{primaryGoal}}}
  - **Important Notes:** {{{notes}}}

  **Coach's Prompt:**
  "{{{customPrompt}}}"

  **Instructions:**
  1.  **Analyze the Request:** Carefully read all the provided information to understand the client's needs and the coach's specific instructions in the prompt.
  2.  **Structure the Program:** Create a well-organized program. Use clear headings for each week and day (e.g., "**Week 1: Foundation**", "**Day 1: Upper Body**").
  3.  **Detail the Exercises:** For each workout day, list the exercises with specific sets, repetitions (reps), and rest periods. For example: "Bench Press: 4 sets of 8-10 reps, 90 seconds rest".
  4.  **Provide Guidance:** Include brief, important notes about warming up, cooling down, progressive overload, and rest days.
  5.  **Maintain a Professional Tone:** The language should be encouraging, professional, and clear.
  6.  **Format for Readability:** Use markdown formatting (bolding, bullet points) to make the program easy to read and follow. Do not use markdown tables. The final output must be a single, coherent string.
  7.  **Generate Only the Program:** Your final output should only contain the workout program itself, formatted as a single string, to fit the 'program' field in the output schema. Do not add any conversational text before or after the program.
  `,
});

const generateProgramFlow = ai.defineFlow(
  {
    name: 'generateProgramFlow',
    inputSchema: ProgramGeneratorInputSchema,
    outputSchema: ProgramGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
