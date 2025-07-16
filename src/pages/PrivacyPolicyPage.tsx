import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img 
                src="/nanas-table-logo.jpg" 
                alt="Nana's Table" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">Privacy Policy for Nana's Table</CardTitle>
            <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Introduction</h2>
                <p>
                  Nana's Table ("we," "our," or "us") is a private family application designed to help the Librach/Nagar family 
                  document and share memories from family gatherings. This Privacy Policy explains how we collect, use, and 
                  protect your information when you use our service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Information We Collect</h2>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Google Account Information</h3>
                <p>When you sign in with Google, we collect:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Your email address</li>
                  <li>Your name</li>
                  <li>Your profile picture (if available)</li>
                  <li>Google account ID for authentication purposes</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">Content You Create</h3>
                <p>We store the content you voluntarily provide, including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Memory details (dates, occasions, attendees, food descriptions)</li>
                  <li>Photos and videos you upload</li>
                  <li>Notes and comments you add to memories</li>
                  <li>Captions for media files</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">How We Use Your Information</h2>
                <p>We use your information solely to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Authenticate your access to the family application</li>
                  <li>Display your name and profile information within the app</li>
                  <li>Store and organize family memories you create or contribute to</li>
                  <li>Enable family members to view and contribute to shared memories</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Information Sharing</h2>
                <p>
                  <strong>We do not sell, trade, or share your personal information with third parties.</strong> 
                  Your information is only accessible to:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Authorized family members who have access to the application</li>
                  <li>Firebase/Google Cloud services that host our application infrastructure</li>
                </ul>
                <p className="mt-3">
                  All content within the app is private to the Librach/Nagar family and is not publicly accessible.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Security</h2>
                <p>We implement security measures to protect your information:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Authentication is handled securely through Google OAuth</li>
                  <li>All data is stored on Google Firebase with industry-standard security</li>
                  <li>Access is restricted to authorized family members only</li>
                  <li>All connections use HTTPS encryption</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Retention</h2>
                <p>
                  We retain your information for as long as you have access to the application. 
                  If you wish to have your data removed, please contact us at the email address below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Access the personal information we have about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Withdraw consent and stop using the application at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Third-Party Services</h2>
                <p>Our application uses the following third-party services:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Google OAuth:</strong> For secure authentication</li>
                  <li><strong>Firebase/Google Cloud:</strong> For data storage and hosting</li>
                  <li><strong>Netlify:</strong> For application hosting and deployment</li>
                </ul>
                <p className="mt-3">
                  These services have their own privacy policies, which we encourage you to review.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Children's Privacy</h2>
                <p>
                  This application is intended for family use and may contain photos and information about 
                  family members of all ages. We do not knowingly collect personal information directly from 
                  children under 13. All content is managed by adult family members.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify users of any material 
                  changes by updating the "Last updated" date at the top of this policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, 
                  please contact us at: <strong>maxlibrach@gmail.com</strong>
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};