
import type { Metadata } from 'next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n';

export const metadata: Metadata = {
  title: 'FAQ – Dhuwa Quit Smoking App | Frequently Asked Questions',
  description:
    'Find answers about the Dhuwa habit tracker. Learn about our philosophy, costs, data privacy, and using the smoke planner and replacement tools to quit.',
};

const faqs = [
  {
    question: 'What is the main philosophy behind Dhuwa?',
    answer:
      'Dhuwa is inspired by Allen Carr’s "Easy Way" method. We believe that quitting is not about a painful battle of willpower, but about understanding the psychological trap of addiction. By observing our habits without judgment, we can dismantle the illusion that smoking provides any real pleasure or crutch, making it easier to walk away.',
  },
  {
    question: 'Is Dhuwa free to use?',
    answer:
      'Yes, Dhuwa is completely free to use. Our mission is to provide a supportive companion for anyone on this journey, without financial barriers.',
  },
  {
    question: 'Is this medical advice? Can it replace patches or gum?',
    answer:
      'No. Dhuwa is an educational and reflective tool, not a medical device. It does not provide medical advice. You should always consult a healthcare professional for medical concerns and before making decisions about your health, including the use of nicotine replacement therapies (NRTs) like patches or gum.',
  },
  {
    question: 'How is my data used?',
    answer:
      'Your data is used only to power the features within the app — such as providing personalized insights in your inbox and visualizing your patterns. We never sell your data. You can read our full Privacy Policy for more details.',
  },
  {
    question: 'Do I have to create an account with an email?',
    answer:
      'No, you can use the app anonymously by just providing a username. If you want to sync your data across multiple devices, you can optionally create an account with an email and password.',
  },
  {
    question: 'Why doesn’t Dhuwa have aggressive reminders or countdowns?',
    answer:
      'We believe that turning your journey into a high-pressure countdown can increase stress and feelings of failure. Dhuwa is designed to be a "quiet insights inbox." It logs your progress and patterns silently, allowing you to review them on your own terms. This fosters mindful self-awareness, not fear-based compliance.',
  },
];

export default function FAQPage() {
    const { locale } = useParams() as { locale: Locale };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mt-2">
          Answers to common questions about our philosophy and features.
        </p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
            <AccordionContent className="prose prose-invert max-w-none text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

        <div className="py-8 text-center">
            <Button asChild size="lg">
                <Link href={`/${locale}/login`}>Join Dhuwa Today</Link>
            </Button>
        </div>
    </div>
  );
}
