import type { Metadata } from 'next';
import { CheckCircle, Zap, BookOpen, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Dhuwa App Features – Habit Tracker, Smoke Planner & Quit Journal',
  description: 'Explore Dhuwa’s quit smoking tools: mindful urge logging, a quiet insights inbox, smoke planner with replacement activities, and pattern tracking to find freedom.',
};

const features = [
    {
        title: "Mindful Urge Logging",
        description: "Quickly log every cigarette or urge with context. No judgment — just honest reflection. Your logs become a mirror that shows you patterns you may not notice, turning data into self-awareness.",
        icon: Zap
    },
    {
        title: "Quiet Insights Inbox",
        description: "Instead of pushy notifications, Dhuwa provides gentle, contextual insights in your notification bell. Check them when you choose — it’s like a journal that speaks back.",
        icon: Bell
    },
    {
        title: "Smoke Planner & Replacements",
        description: "Plan your day and decide which moments to skip. Replace them with healthier actions (walk, water, breathing). The app celebrates these shifts as the real key to freedom.",
        icon: BookOpen
    },
    {
        title: "Pattern & Streak Tracking",
        description: "Dhuwa surfaces your peak craving times, daily progress, and hidden habits to help you understand *why* you smoke, not just when. See your smoke-free streaks build.",
        icon: CheckCircle
    },
    {
        title: "Personalized Encouragement",
        description: "Every insight and summary adapts to your progress and choices. The AI-powered reflections feel unique and personal, so you feel truly seen on your journey.",
        icon: CheckCircle
    },
    {
        title: "Anonymous or Synced Accounts",
        description: "Stay fully anonymous with just a username, or register with an email and password to sync your journey across multiple devices.",
        icon: CheckCircle
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
                     <feature.icon className="w-6 h-6 text-primary" />
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
