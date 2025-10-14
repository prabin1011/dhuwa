import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Dhuwa App Support',
};

export default function ContactPage() {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold">Contact Us</h2>
      <p className="text-muted-foreground">
        For questions, feedback, or support, please reach out.
      </p>
      <div className="flex justify-center items-center gap-2 pt-4">
          <Mail className="w-5 h-5 text-primary" />
          <a href="mailto:support@dhuwa.app" className="text-lg font-semibold hover:underline">
            support@dhuwa.app
          </a>
      </div>
       <p className="text-xs text-muted-foreground pt-8">
        We do our best to respond to all inquiries within 48 hours.
      </p>
    </div>
  );
}
