
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { firebaseConfig } from '@/lib/firebaseConfig';

const DatabasePage = () => {

  const projectId = firebaseConfig.projectId || 'YOUR_PROJECT_ID';
  const firestoreIndexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes`;

  return (
    <div className="space-y-6">
       <div>
            <h1 className="text-3xl font-bold">Database Management</h1>
            <p className="text-muted-foreground">Tools and information for managing your Firestore database.</p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Firestore Indexes</CardTitle>
          <CardDescription>
            Firestore requires composite indexes for complex queries. If you see errors related to fetching data (e.g., on the Orders page), you likely need to create one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Missing Index?</AlertTitle>
                <AlertDescription>
                    Firebase provides helpful error messages in your browser's developer console. If a query fails, the console error will often include a direct link to create the required index in your Firebase project.
                </AlertDescription>
            </Alert>
          <p>
            You can manage your Firestore indexes directly in the Firebase Console. Click the button below to go to the Firestore Indexes panel for your project.
          </p>
          <a href={firestoreIndexUrl} target="_blank" rel="noopener noreferrer">
            <Button>
              Manage Indexes <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabasePage;
