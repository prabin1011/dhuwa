import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dhuwa App Terms & Conditions | Usage, Data, Disclaimer',
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Terms and Conditions</h2>
      <p>Last updated: October 06, 2025</p>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Introduction</h3>
        <p>
          Welcome to "Dhuwa" (the “App”). By accessing or using the App, you agree to these Terms and Conditions (“Terms”). If you do not agree, please discontinue use.
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Medical Disclaimer</h3>
        <p>
          The App is not a medical device. It provides educational and reflective insights only. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for health concerns.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Eligibility & Use</h3>
        <ul className="list-disc pl-6 space-y-1">
            <li>You must be 18 years or older to use the App.</li>
            <li>You are responsible for your activity within the App and for complying with applicable laws.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Accounts</h3>
         <ul className="list-disc pl-6 space-y-1">
            <li>You may use the App anonymously with a username.</li>
            <li>If you register with email/password, your data can sync across devices.</li>
            <li>You are responsible for safeguarding your credentials.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Data & Privacy</h3>
        <ul className="list-disc pl-6 space-y-1">
            <li>Your data (habits, moods, logs) is stored securely in Firebase.</li>
            <li>We never sell your data.</li>
            <li>Data is used only to provide App functionality and personalized insights.</li>
            <li>See our <a href="/privacy" className="font-semibold underline">Privacy Policy</a> for details.</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by law, Dhuwa’s creators are not liable for indirect, incidental, or consequential damages arising from use of the App.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Changes to Terms</h3>
        <p>
          We may update these Terms. Updates will be posted in-app or on this page. Continued use means acceptance of the new Terms.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Contact Us</h3>
        <p>
          If you have questions about these Terms, email us at: <a href="mailto:support@dhuwa.app" className="font-semibold underline">support@dhuwa.app</a>
        </p>
      </div>
    </div>
  );
}
