
"use client";

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, FileDown, MessageSquare } from 'lucide-react';
import { generateProgram } from '@/ai/flows/program-generator-flow';

interface Client {
  id: string;
  fullName: string;
  primaryGoal: string;
  notes: string;
  phoneNumber: string;
  [key: string]: any;
}

const ProgramGenerator = ({ client }: { client: Client }) => {
  const [prompt, setPrompt] = useState(`Generate a new 4-week workout program for ${client.fullName}, focusing on their goal of ${client.primaryGoal.replace('_', ' ')}. Consider their notes: ${client.notes || 'None'}. The program should be well-structured with clear instructions for exercises, sets, and reps for each day.`);
  const [generatedProgram, setGeneratedProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedProgram('');
    try {
      const result = await generateProgram({
        clientName: client.fullName,
        primaryGoal: client.primaryGoal,
        notes: client.notes,
        customPrompt: prompt,
      });
      setGeneratedProgram(result.program);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to generate program. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!generatedProgram) {
        toast({ title: 'No Program', description: 'Please generate a program first.', variant: 'destructive' });
        return;
    }

    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(`Workout Program for ${client.fullName}`, 105, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    
    // Split text into lines to fit the page width
    const splitText = doc.splitTextToSize(generatedProgram, 180);
    doc.text(splitText, 15, 40);

    doc.save(`${client.fullName}_program.pdf`);
  };
  
  const whatsappMessage = `Hi ${client.fullName}, here is your new training program! I've attached it as a PDF. Let me know if you have any questions.`;
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
            <Textarea value={generatedProgram} readOnly rows={15} className="font-mono text-xs bg-muted"/>
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
