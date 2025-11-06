import type { Metadata } from 'next';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dhuwa App Features – Your Companion to Quit Smoking Mindfully',
  description: 'Explore Dhuwa’s features: urge logging, quiet insights inbox, replacement activities, pattern tracking, and personalized encouragement.',
};

const features = [
    {
        title: "Urge Logging",
        description: "Quickly log every cigarette or urge. No judgment — just honest reflection. Your logs become a mirror that shows you patterns you may not notice."
    },
    {
        title: "Quiet Insights Inbox",
        description: "Instead of pushy notifications, Dhuwa provides gentle, contextual insights stored in your notification bell. Check them when you choose — it’s like a journal that speaks back to you."
    },
    {
        title: "Replacement Activities",
        description: "Pick healthier actions (walk, water, breathwork, journaling). The app celebrates these shifts — reminding you they’re the real key to freedom."
    },
    {
        title: "Patterns & Streaks",
        description: "Dhuwa doesn’t just track time. It surfaces morning smoking spikes, weekly reflection summaries, and hidden habits to help you understand *why* you smoke."
    },
    {
        title: "Personalized Encouragement",
        description: "Every insight feels unique, never robotic. Templates adapt to your name, your progress, and your choices — so you feel truly seen."
    },
    {
        title: "Anonymous or Synced Accounts",
        description: "Stay fully anonymous with just a username, or register with an email and password to sync your journey across devices."
    }
];

export default function FeaturesPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Features</h1>
        <p className="text-muted-foreground mt-2">The tools you need to find freedom, mindfully.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
                <div className="flex items-center gap-3">
                     <CheckCircle className="w-6 h-6 text-primary" />
                    <CardTitle>{feature.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
