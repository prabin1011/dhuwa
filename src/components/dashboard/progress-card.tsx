import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProgressCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description: string;
  className?: string;
}

export function ProgressCard({ title, value, icon: Icon, description, className }: ProgressCardProps) {
  return (
    <Card className={cn('transform transition-transform hover:scale-105 hover:shadow-lg', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{value}</div>
        <p className="pt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
