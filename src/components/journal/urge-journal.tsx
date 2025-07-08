'use client';

import { useState, useEffect } from 'react';
import { UrgeForm, type UrgeEntry, type UrgeFormData } from './urge-form';
import { UrgeList } from './urge-list';
import { UrgeAnalysis } from './urge-analysis';
import { analyzeUrgeJournal, type UrgeAnalysisOutput } from '@/ai/flows/urge-analysis';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'urgeJournalEntries';

export function UrgeJournal() {
  const [entries, setEntries] = useState<UrgeEntry[]>([]);
  const [analysis, setAnalysis] = useState<UrgeAnalysisOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedEntries = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries).map((e: UrgeEntry) => ({...e, timestamp: new Date(e.timestamp)})));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = (data: UrgeFormData) => {
    const newEntry: UrgeEntry = {
      ...data,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setEntries((prev) => [newEntry, ...prev]);
  };

  const handleAnalyzeJournal = async () => {
    if (entries.length < 3) {
        alert("Please add at least 3 entries to get a meaningful analysis.");
        return;
    }
    
    setIsAnalyzing(true);
    setAnalysis(null);

    const journalString = entries
      .map(
        (e) =>
          `${e.timestamp.toLocaleString()}: Location: ${e.location}, Trigger: ${e.trigger}, Intensity: ${e.intensity}/10`
      )
      .join('\n');

    try {
      const result = await analyzeUrgeJournal({ journalEntries: journalString });
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing journal:', error);
      alert('There was an error analyzing your journal. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-2">
            <UrgeForm onSubmit={addEntry} />
        </div>
        <div className="lg:col-span-3">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline text-2xl">Your Log</h2>
              <Button onClick={handleAnalyzeJournal} disabled={isAnalyzing || entries.length === 0}>
                {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Analyze Journal
              </Button>
            </div>
            <div className="flex-1">
              <UrgeList entries={entries} />
            </div>
          </div>
        </div>
      </div>
      {isAnalyzing && (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            <p className="ml-4 text-muted-foreground">The AI is analyzing your patterns...</p>
        </div>
      )}
      {analysis && <UrgeAnalysis analysis={analysis} />}
    </div>
  );
}
