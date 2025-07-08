import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

export type Message = {
  role: 'user' | 'assistant';
  content: string | React.ReactNode;
};

interface ChatMessageProps {
  message?: Message;
  isLoading?: boolean;
}

export function ChatMessage({ message, isLoading = false }: ChatMessageProps) {
  const isUser = message?.role === 'user';
  const role = isUser ? 'User' : 'AI';

  if (isLoading) {
    return (
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 border">
          <AvatarFallback>
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!message) return null;

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <Avatar className="h-9 w-9 border">
         <AvatarFallback>{isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'flex-1 space-y-1 rounded-lg px-4 py-3',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-card'
        )}
      >
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      </div>
    </div>
  );
}
