import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
};

export default function AboutPage() {
  return (
    <div>
      <h2>About "The Easy Way Out"</h2>
      <p>
        Welcome to your personal companion on the journey to becoming smoke-free. Inspired by the principles of understanding and awareness, our app is designed not as a tool of force, but as a guide to help you see the smoking trap for what it is.
      </p>
      <p>
        Our mission is to empower you with data and insights about your own habits. By tracking your urges, moods, and the moments you choose to smoke or not to smoke, you begin to unravel the psychological puzzle of addiction. We believe that with the right information and a supportive mindset, quitting doesn't have to be a struggle filled with willpower battles. Instead, it can be a joyful release.
      </p>
      <p>
        This app provides:
      </p>
      <ul>
        <li><strong>Personalized Tracking:</strong> Log your smokes, urges, and moods to see clear patterns emerge.</li>
        <li><strong>AI-Powered Insights:</strong> Get non-judgmental, personalized feedback that helps you understand your triggers and celebrate your victories.</li>
        <li><strong>Goal-Oriented Planning:</strong> Whether you want to quit or cut down, you set the pace. Plan your smokes and challenge yourself to replace them with positive activities.</li>
        <li><strong>Progress at a Glance:</strong> See how much time and money you're saving, and watch your smoke-free streaks grow.</li>
      </ul>
      <p>
        You've already taken the most important step by deciding to explore your habits. We're here to support you on the rest of your journey to freedom.
      </p>
    </div>
  );
}
