
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-3xl">Privacy Policy for ChatterBox</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm md:prose-base max-w-none">
            <p className="text-center text-muted-foreground">
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <p>
                Welcome to ChatterBox. We are committed to protecting your privacy and handling your personal information in an open and transparent manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our chat application.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
                We may collect information about you in a variety of ways. The information we may collect via the Application includes:
            </p>
            <ul>
                <li>
                <strong>Personal Data:</strong> Personally identifiable information, such as your name, username, email address, and profile photo, that you voluntarily give to us when you register with the Application.
                </li>
                <li>
                <strong>Conversation Data:</strong> Messages, images, files, and other content you send or receive are stored on your local device. We do not have access to your private conversations.
                </li>
                <li>
                <strong>Contact Information:</strong> We may access your contacts to help you connect with other users, but only with your explicit permission.
                </li>
                <li>
                <strong>Device and Usage Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, browser type, and the dates and times of your access. Since this is a demo application, this data is not actually collected or stored.
                </li>
            </ul>

            <h2>2. Use of Your Information</h2>
            <p>
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we use information collected about you via the Application to:
            </p>
            <ul>
                <li>Create and manage your account.</li>
                <li>Enable user-to-user communications.</li>
                <li>Personalize your user experience.</li>
                <li>Manage your privacy and notification settings.</li>
            </ul>

            <h2>3. Disclosure of Your Information</h2>
            <p>
                ChatterBox is a demonstration application and operates entirely within your browser using local storage. Your data, including personal information and conversation history, is not sent to or stored on any remote server.
            </p>
            <ul>
                <li>
                <strong>We do not sell, trade, or rent your personal information to third parties.</strong>
                </li>
                <li>
                Your profile information (name, username, avatar) is shared with other users you interact with on the platform.
                </li>
            </ul>

            <h2>4. Security of Your Information</h2>
            <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2>5. Your Privacy Choices</h2>
            <p>You have control over your privacy settings within the application, including:</p>
            <ul>
                <li>Who can see your profile photo, "about" information, and last seen status.</li>
                <li>Whether to enable or disable read receipts.</li>
                <li>Blocking users.</li>
            </ul>

            <h2>6. Data Deletion</h2>
            <p>
                You can delete your account at any time from the "Account" settings page. This action is irreversible and will remove all your data from the application's local storage.
            </p>

            <h2>7. Changes to This Privacy Policy</h2>
            <p>
                We may update this Privacy Policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons.
            </p>

        </CardContent>
      </Card>
    </div>
  );
}
