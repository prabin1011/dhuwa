import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b py-4 mb-6 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link href="/" className="p-2 rounded-full hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Legal Information</h1>
          </div>
        </header>
        <main>
          <article className="prose prose-invert">
              {children}
          </article>
        </main>
      </div>
    </div>
  );
}
