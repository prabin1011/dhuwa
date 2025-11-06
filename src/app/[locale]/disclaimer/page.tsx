import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer | Dhuwa Quit Smoking App',
  description: 'Dhuwa is an educational tool, not medical advice. Consult a healthcare professional for decisions about quitting smoking or your health.',
};

export default function DisclaimerPage() {
  return (
    <div className="space-y-6">
      <p className="text-lg text-muted-foreground">
        This app provides educational and reflective support only. It is not medical advice. Always consult a doctor for health matters.
      </p>
       <p>
          The content and insights provided by the App, including any AI-generated suggestions, are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or received from this App.
        </p>
    </div>
  );
}
