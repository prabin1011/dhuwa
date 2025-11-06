
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base sm:text-lg font-semibold">Frequently Asked Questions</h1>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 py-8">
          <article className="prose prose-invert mx-auto">
            {children}
          </article>
        </div>
      </main>
    </div>
  );
}
