import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSandboxApiKey } from '@/hooks/sandbox/useSandboxApiKey';
import SandboxApiSetup from './SandboxApiSetup';
import { Loader2 } from 'lucide-react';

/**
 * Sandbox Layout - Wraps all sandbox pages
 * Handles authentication and API key verification
 */
const SandboxLayout: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { apiKey, loading: apiKeyLoading, hasApiKey } = useSandboxApiKey();
  const navigate = useNavigate();
  const [showApiSetup, setShowApiSetup] = useState(false);

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?returnTo=/sandbox');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    // Show API setup if no key is stored
    if (!apiKeyLoading && !hasApiKey) {
      setShowApiSetup(true);
    } else {
      setShowApiSetup(false);
    }
  }, [apiKeyLoading, hasApiKey]);

  // Loading state
  if (authLoading || apiKeyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Loading Sandbox...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Show API key setup modal
  if (showApiSetup) {
    return <SandboxApiSetup onComplete={() => setShowApiSetup(false)} />;
  }

  // Render sandbox content
  return <Outlet />;
};

export default SandboxLayout;

