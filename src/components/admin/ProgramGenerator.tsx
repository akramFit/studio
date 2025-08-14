"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, FileDown, MessageSquare } from 'lucide-react';

interface Client {
  id: string;
  fullName: string;
  primaryGoal: string;
  notes: string;
  phoneNumber: string;
  [key: string]: any;
}

// This is a placeholder for a real AI flow call.
// In a real application, you would import and call a flow from `src/ai/flows`.
const generateProgramWithAI = async (prompt: string): Promise<string> => {
  console.log("AI Prompt:", prompt);
  return new Promise(resolve => setTimeout(() => resolve(`
**Workout Program for ${prompt.split(' ')[2]}**

**Phase 1: Foundation (Weeks 1-4)**
*Focus: Hypertrophy and building a strong base.*

**Day 1: Upper Body Strength**
- Bench Press: 4 sets of 6-8 reps
- Pull-Ups: 4 sets to failure
- Overhead Press: 3 sets of 8-10 reps
- Bent Over Rows: 3 sets of 8-10 reps
- Bicep Curls: 3 sets of 10-12 reps
- Tricep Pushdowns: 3 sets of 10-12 reps

**Day 2: Lower Body Power**
- Squats: 4 sets of 6-8 reps
- Deadlifts: 3 sets of 5 reps
- Leg Press: 3 sets of 10-12 reps
- Hamstring Curls: 3 sets of 10-12 reps
- Calf Raises: 4 sets of 15-20 reps

*Rest days are crucial. Ensure 1-2 days of rest per week.*
*This is a sample program. Please consult with your coach.*
  `), 2000));
};

const ProgramGenerator = ({ client }: { client: Client }) => {
  const [prompt, setPrompt] = useState(`Generate a new program for ${client.fullName}, focusing on their goal of ${client.primaryGoal.replace('_', ' ')}. Consider their notes: ${client.notes || 'None'}`);
  const [generatedProgram, setGeneratedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedProgram('');
    try {
      const result = await generateProgramWithAI(prompt);
      setGeneratedProgram(result);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate program.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    // PDF generation logic would go here using a library like jsPDF.
    // This is a placeholder as we cannot add new npm packages.
    toast({
        title: 'PDF Generation (Placeholder)',
        description: 'In a real app, this would generate and download a PDF of the program.',
    });
    // Example jsPDF logic:
    // const doc = new jsPDF();
    // doc.text(generatedProgram, 10, 10);
    // doc.save(`${client.fullName}_program.pdf`);
  };
  
  const whatsappMessage = `Hi ${client.fullName}, here is your new training program! Let me know if you have any questions.`;
  const whatsappUrl = `https://wa.me/${client.phoneNumber.replace(/\s+/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Program Generator</CardTitle>
        <CardDescription>Generate and manage training programs for {client.fullName}.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">AI Prompt</label>
          <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} />
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Program'}
        </Button>

        {generatedProgram && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Generated Program:</h3>
            <Textarea value={generatedProgram} readOnly rows={15} className="font-mono text-xs bg-gray-50"/>
            <div className="flex gap-2">
                <Button onClick={handleDownloadPdf} variant="outline" className="w-full">
                    <FileDown className="mr-2 h-4 w-4" /> Download as PDF
                </Button>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full bg-green-500 text-white hover:bg-green-600 hover:text-white">
                        <MessageSquare className="mr-2 h-4 w-4" /> Send on WhatsApp
                    </Button>
                </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramGenerator;
