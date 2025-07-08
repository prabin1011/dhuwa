'use client';
import type { UrgeEntry } from './urge-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

interface UrgeListProps {
  entries: UrgeEntry[];
}

export function UrgeList({ entries }: UrgeListProps) {
  if (entries.length === 0) {
    return (
      <Card className="flex h-full items-center justify-center p-8">
        <p className="text-center text-muted-foreground">
          You haven't logged any urges yet. <br /> That's a great sign!
        </p>
      </Card>
    );
  }

  const getIntensityBadgeVariant = (intensity: number) => {
    if (intensity > 7) return "destructive";
    if (intensity > 4) return "secondary";
    return "default";
  }

  return (
    <Card className="h-full">
        <ScrollArea className="h-[400px]">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead className="text-right">Intensity</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {entries.map((entry) => (
                    <TableRow key={entry.id}>
                    <TableCell>
                        <div className="font-medium">{entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-muted-foreground">{entry.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{entry.trigger}</div>
                        <div className="text-xs text-muted-foreground">{entry.location}</div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge variant={getIntensityBadgeVariant(entry.intensity)}>{entry.intensity}/10</Badge>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </ScrollArea>
    </Card>
  );
}
