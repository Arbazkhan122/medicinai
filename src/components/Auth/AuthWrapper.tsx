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
        <SignupPage onSwitchToLogin={() => setAuthMode('login')} />
      );
      
    case 'storage':
      return <StorageSetup />;
      
    default:
      return (
        <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
      );
  }
};