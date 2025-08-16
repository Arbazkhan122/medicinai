import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { StorageSetup } from './StorageSetup';
import { useAuthStore } from '../../store/authStore';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'storage'>('login');

  // If user is authenticated, show the main app
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Show appropriate auth screen
  switch (authMode) {
    case 'signup':
      return (
        <div>
          <SignupPage />
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setAuthMode('login')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      );
      
    case 'storage':
      return <StorageSetup />;
      
    default:
      return (
        <div>
          <LoginPage />
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setAuthMode('signup')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Don't have an account? Create Account
            </button>
          </div>
        </div>
      );
  }
};