import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Quote } from 'lucide-react';

interface InspirationCardProps {
  item: {
    id: string;
    type: 'quote' | 'story' | 'excerpt';
    content: string;
    source: string;
    title?: string;
  };
}

export function InspirationCard({ item }: InspirationCardProps) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-xl">
      <CardHeader>
        {item.type === 'quote' && (
          <Quote className="h-8 w-8 text-primary/50" aria-hidden="true" />
        )}
        {item.title && <CardTitle className="font-headline text-2xl">{item.title}</CardTitle>}
      </CardHeader>
      <CardContent>
        <p className={`text-muted-foreground ${item.type === 'quote' ? 'text-xl italic' : ''}`}>
          {item.content}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between bg-secondary/30 px-6 py-3">
        <Badge variant={item.type === 'quote' ? 'default' : 'secondary'} className="capitalize">{item.type}</Badge>
        <p className="text-sm font-medium text-muted-foreground">{item.source}</p>
      </CardFooter>
    </Card>
  );
}
