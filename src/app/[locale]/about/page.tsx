'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';

export default function AboutPage() {
    const { locale } = useParams() as { locale: Locale };

  return (
    <div className="space-y-6">
      <div className="space-y-4 text-base italic text-foreground/90">
          <p>
              In Nepali, "Dhuwa" means smoke — the ghost we are gently chasing away.
          </p>
          <p>
              In Yolŋu (First Nations of Australia), Dhuwa is one half of everything: balance, harmony, and cosmic wholeness.
          </p>
          <p>
              In Bidjara (an Aboriginal language of Queensland), it means "to feel alive" — the very goal of this journey.
          </p>
      </div>
      <p>
        This app was born from the belief that smoking is not your comfort or your friend — it’s the trap. Inspired by Allen Carr’s philosophy, we focus on clarity, not willpower. Freedom comes from seeing the truth, not fighting cravings like an endless battle.
      </p>

       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Our Mission</h3>
        <p>To guide people into freedom from smoking — gently, mindfully, and without fear.</p>
        <p>We don’t measure success in numbers of cigarettes avoided. We measure it in clarity gained, balance restored, and the return of life’s simple joys.</p>
      </div>
      
       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Our Vision</h3>
        <p>A world where smoking is not a struggle to resist, but simply irrelevant.</p>
        <p>We envision millions of people waking up each day without the weight of nicotine, discovering energy, presence, and balance in their lives.</p>
      </div>

       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Our Aspiration</h3>
        <p>To dismantle the myths and illusions that make smoking seem necessary.</p>
        <p>To transform quitting into an act of freedom, not punishment.</p>
        <p>To give people tools to observe their patterns, reflect deeply, and reclaim control at their own pace.</p>
      </div>

       <p className="italic text-foreground/80">
        We believe, as Allen Carr once wrote: “When you stop, you are not giving up anything — you are returning to everything.”
      </p>
      
       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Why Dhuwa is Different</h3>
        <p>Unlike willpower-based trackers that turn your journey into a punishment and countdowns, Dhuwa acts as a silent observer. It reflects back your choices, your wins, and your patterns — so you can see the truth for yourself.</p>
      </div>
      
       <p>Welcome to your journey. Welcome to Dhuwa.</p>
        <div className="py-8 text-center">
            <Button asChild size="lg">
                <Link href={`/${locale}/login`}>Join Dhuwa Today</Link>
            </Button>
        </div>
    </div>
  );
}
