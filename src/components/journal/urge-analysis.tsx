import type { UrgeAnalysisOutput } from "@/ai/flows/urge-analysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Lightbulb, ListChecks, Repeat } from "lucide-react";

interface UrgeAnalysisProps {
    analysis: UrgeAnalysisOutput;
}

export function UrgeAnalysis({ analysis }: UrgeAnalysisProps) {
    return (
        <Card className="bg-secondary/50 border-primary/20">
            <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Your Urge Analysis
                </CardTitle>
                <CardDescription>{analysis.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-headline text-lg mb-2 flex items-center gap-2"><Repeat className="text-accent" /> Common Triggers & Patterns</h3>
                    <p className="text-sm text-muted-foreground mb-3">{analysis.patterns}</p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.triggers.map((trigger, index) => (
                            <Badge key={index} variant="secondary">{trigger}</Badge>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="font-headline text-lg mb-2 flex items-center gap-2"><ListChecks className="text-primary"/> Suggested Coping Strategies</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{analysis.copingStrategies}</p>
                </div>
            </CardContent>
        </Card>
    );
}
