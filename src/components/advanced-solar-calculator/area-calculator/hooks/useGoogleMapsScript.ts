
import { useState, useEffect } from 'react';

// Script status states
type ScriptStatus = 'loading' | 'ready' | 'error';

// Hook to load Google Maps script
export const useGoogleMapsScript = (apiKey: string | null) => {
  const [status, setStatus] = useState<ScriptStatus>('loading');

  useEffect(() => {
    // If no API key, mark as error
    if (!apiKey) {
      setStatus('error');
      return;
    }

    // Check if script already exists
    if (window.google && window.google.maps) {
      setStatus('ready');
      return;
    }

    // Create a unique ID for the script
    const scriptId = 'google-maps-script';
    
    // Check if script is already being loaded
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (script) {
      // Script exists, check its status
      if (script.getAttribute('data-loaded') === 'true') {
        setStatus('ready');
      }
      return;
    }

    // Create and load script
    script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,geometry,marker`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-loaded', 'false');

    // Event handlers
    const handleScriptLoad = () => {
      script.setAttribute('data-loaded', 'true');
      setStatus('ready');
    };

    const handleScriptError = () => {
      script.remove();
      setStatus('error');
    };

    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);

    // Add script to document
    document.head.appendChild(script);

    // Cleanup
    return () => {
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
      // We don't remove the script element to prevent multiple loads
    };
  }, [apiKey]);

  return status;
};
