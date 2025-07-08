import { inspirationalContent } from '@/lib/data';
import { InspirationCard } from './inspiration-card';

export function InspirationFeed() {
  return (
    <div className="p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {inspirationalContent.map((item) => (
          <InspirationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
