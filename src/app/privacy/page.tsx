import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dhuwa App Privacy Policy | Data Protection & User Rights',
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Privacy Policy</h2>
      <p>Last updated: October 06, 2025</p>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Information We Collect</h3>
        <p>
          We collect only the data you voluntarily provide: a username, an optional email address for account recovery and syncing, and your activity logs (e.g., smoking urges, moods, replacement activities, and goals).
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">How We Use Your Information</h3>
        <p>
          Your data is used exclusively to provide and improve the App's core functionality. This includes personalizing insights, visualizing your progress, and maintaining the performance of the services. We do not use your data for advertising purposes.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Data Storage and Security</h3>
        <p>
          All your data is stored securely in Firebase, a platform provided by Google. We rely on their industry-standard security measures to protect your information.
        </p>
      </div>

       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Third-Party Services</h3>
        <p>
          We may use analytics services like Google Analytics or Firebase Crashlytics to understand app usage and improve stability. These services collect anonymized data and do not have access to your personal logs.
        </p>
      </div>

       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Cookies and Tracking</h3>
        <p>
          The App may use essential cookies or device identifiers to maintain your session and for analytics purposes. We do not use third-party tracking cookies for advertising.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Your Rights and Data Deletion</h3>
        <p>
          You have the right to delete your account and all associated data at any time. This can be done from your profile settings within the app. You may also email us at <a href="mailto:support@dhuwa.app" className="font-semibold underline">support@dhuwa.app</a> to request data deletion.
        </p>
      </div>
      
       <div className="space-y-2">
        <h3 className="text-xl font-semibold">Children's Privacy</h3>
        <p>
          The App is not intended for use by individuals under the age of 18. We do not knowingly collect data from children.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Changes to This Policy</h3>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
        </p>
      </div>
    </div>
  );
}
