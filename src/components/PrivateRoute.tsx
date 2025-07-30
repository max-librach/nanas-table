import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignInPage } from '../pages/SignInPage';

interface PrivateRouteProps {
  children: React.ReactNode;
}

// Loading component with branding
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex flex-col items-center justify-center">
    <div className="text-center">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
        <svg className="w-12 h-12 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Nana's Table</h1>
      <p className="text-gray-600 mb-8">Loading your family memories...</p>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
    </div>
  </div>
);

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <SignInPage />;
  }

  return <>{children}</>;
};