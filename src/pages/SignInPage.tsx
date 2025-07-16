import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const SignInPage: React.FC = () => {
  const { signIn, error, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full overflow-hidden">
            <img 
              src="/nanas-table-logo.jpg" 
              alt="Nana's Table" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">Nana's Table</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Where we eat, drink, and celebrate
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <div className="text-left">
                    <span className="text-sm font-medium">{error}</span>
                    {error.includes('browser') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p><strong>Mobile users:</strong> Try these steps:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li><strong>Safari:</strong> Settings → Safari → Clear History and Website Data</li>
                          <li><strong>Chrome:</strong> Settings → Privacy → Clear Browsing Data</li>
                          <li>Turn OFF "Prevent Cross-Site Tracking" in Safari</li>
                          <li>Enable cookies and disable ad blockers</li>
                          <li>Try Chrome browser if using Safari</li>
                          <li>Restart your browser completely</li>
                        </ul>
                      </div>
                    )}
                    {error.includes('Safari') && (
                      <div className="mt-2 text-xs text-red-600">
                        <p><strong>Safari-specific fix:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Settings → Safari → Privacy & Security</li>
                          <li>Turn OFF "Prevent Cross-Site Tracking"</li>
                          <li>Turn OFF "Block All Cookies"</li>
                          <li>Clear History and Website Data</li>
                          <li>Or try Chrome browser instead</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={signIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium py-3 flex items-center justify-center space-x-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};