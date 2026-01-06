'use client';

import { CheckCircle, Zap, BookOpen, Bell, Feather } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';

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
        title: "Write Reflections (via Prakakura)",
        description: "For deeper thoughts, Dhuwa is linked with Prakakura, a private journaling space. Write freely about your journey, your struggles, and your wins without judgment.",
        icon: Feather
    },
    {
        title: "Anonymous or Synced Accounts",
        description: "Stay fully anonymous with just a username, or register with an email and password to sync your journey across multiple devices.",
        icon: CheckCircle
    }
];

export default function FeaturesPage() {
    const { locale } = useParams() as { locale: Locale };

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
        <div className="py-8 text-center">
            <Button asChild size="lg">
                <Link href={`/${locale}/login`}>Join Dhuwa Today</Link>
            </Button>
        </div>
    </div>
  );
}
