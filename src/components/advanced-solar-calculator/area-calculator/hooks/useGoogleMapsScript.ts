
import { useState, useEffect } from 'react';

type ScriptStatus = 'loading' | 'ready' | 'error';

// Create a global tracking variable to ensure we don't load the script multiple times
if (typeof window !== 'undefined' && !window.googleMapsScriptStatus) {
  window.googleMapsScriptStatus = 'not-loaded';
}

// Export the hook
export const useGoogleMapsScript = (apiKey: string): ScriptStatus => {
  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>(
    // Initial state based on global status
    typeof window !== 'undefined' && window.googleMapsScriptStatus === 'ready' 
      ? 'ready' 
      : typeof window !== 'undefined' && window.googleMapsScriptStatus === 'loading'
        ? 'loading'
        : 'loading'
  );

  useEffect(() => {
    // If window is not defined, we're in SSR, skip
    if (typeof window === 'undefined') return;
    
    // If Google Maps is already loaded, we don't need to do anything
    if (window.google && window.google.maps) {
      console.log('Google Maps script already loaded');
      window.googleMapsScriptStatus = 'ready';
      setScriptStatus('ready');
      return;
    }

    // If script is already loading, don't start another load
    if (window.googleMapsScriptStatus === 'loading') {
      console.log('Google Maps script is already loading');
      return;
    }

    // Begin loading the script
    const loadScript = () => {
      if (!apiKey) {
        console.error('No Google Maps API key provided');
        setScriptStatus('error');
        window.googleMapsScriptStatus = 'error';
        return;
      }

      try {
        console.log('Loading Google Maps script...');
        window.googleMapsScriptStatus = 'loading';
        
        // Create script tag
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry,marker`;
        script.async = true;
        script.defer = true;
        
        // Set successful load handler
        script.onload = () => {
          console.log('Google Maps script loaded successfully');
          window.googleMapsScriptStatus = 'ready';
          setScriptStatus('ready');
        };
        
        // Set error handler
        script.onerror = () => {
          console.error('Error loading Google Maps script');
          window.googleMapsScriptStatus = 'error';
          setScriptStatus('error');
        };
        
        // Append script to document
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error setting up Google Maps script:', error);
        window.googleMapsScriptStatus = 'error';
        setScriptStatus('error');
      }
    };

    loadScript();
  }, [apiKey]);

  return scriptStatus;
};

// Extend the Window interface to include our tracking variable
declare global {
  interface Window {
    googleMapsScriptStatus?: 'not-loaded' | 'loading' | 'ready' | 'error';
  }
}
