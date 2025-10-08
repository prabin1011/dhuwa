
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Dhuwa',
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">About Dhuwa</h2>
      <div className="space-y-4 text-base italic text-foreground/90">
          <p>
              In Nepali, "Dhuwa" means smoke. It is the ghost we are chasing away.
          </p>
          <p>
              In the language of the Yolŋu people of Australia, "Dhuwa" is one half of everything; a cosmic balance. It represents a fundamental part of the whole, a piece of a larger story.
          </p>
          <p>
              In the Bidjara tongue, it means "to feel alive."
          </p>
          <p>
              This app is built on that poetry.
          </p>
      </div>
      <p>
        It is a companion to help you see the smoke for what it is, to find the balance in your life that it has disturbed, and to step back into the vibrant, beautiful feeling of being truly alive.
      </p>
      <p>
        Here, we don’t fight with willpower. We don’t count days as if they are a prison sentence. Instead, we observe. We understand. We dismantle the trap, piece by piece, until we can simply walk away, not as someone who is "quitting," but as someone who is free.
      </p>
       <p>
        Welcome to your journey. Welcome to Dhuwa.
      </p>
    </div>
  );
}
