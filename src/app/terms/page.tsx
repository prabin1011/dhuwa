
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
};

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Terms and Conditions</h2>
      <p>Last updated: October 06, 2025</p>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">1. Introduction</h3>
        <p>
          Welcome to "Dhuwa" ("App"). This App is provided to you as a tool to help you understand and change your smoking habits. By using our App, you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, do not use the App.
        </p>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">2. Medical Disclaimer</h3>
        <p>
          The App is not a medical device and does not provide medical advice. It is intended for informational and educational purposes only. The content and insights provided by the App, including any AI-generated suggestions, are not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or received from this App.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">3. Use of the App</h3>
        <p>
          You must be at least 18 years old to use this App. You agree to use the App in compliance with all applicable laws. You are responsible for any data you enter into the App.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">4. Anonymous and Registered Accounts</h3>
        <p>
          You may use the App anonymously by providing a username. If you choose to register with an email and password, your data will be synced across devices. You are responsible for maintaining the confidentiality of your account information.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">5. Data and Privacy</h3>
        <p>
          Your data, including your habits, moods, and other information you provide, is stored securely in Firebase. We do not sell your personal data. We use this data solely to provide you with the services of the App, such as generating personalized insights. For more information, please see our Privacy Policy (link to be added).
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">6. Limitation of Liability</h3>
        <p>
          To the fullest extent permitted by law, the developers of this App shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the App; (b) any conduct or content of any third party on the App.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">7. Changes to Terms</h3>
        <p>
          We may modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. You are advised to review these Terms periodically for any changes.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">8. Contact Us</h3>
        <p>
          If you have any questions about these Terms, please contact us.
        </p>
      </div>
    </div>
  );
}
