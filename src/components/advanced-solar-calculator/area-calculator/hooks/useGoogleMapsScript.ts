
import { useState, useEffect } from 'react';

type ScriptStatus = 'loading' | 'ready' | 'error';

// Define libraries array for Google Maps
const libraries = ["drawing", "geometry", "marker"] as ("drawing" | "geometry" | "places" | "visualization" | "marker")[];

// Track script loading status globally to prevent multiple loads
let scriptLoadingStatus: ScriptStatus = 'loading';
let globalScriptLoadPromise: Promise<void> | null = null;

export const useGoogleMapsScript = (apiKey: string): ScriptStatus => {
  const [status, setStatus] = useState<ScriptStatus>(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      return 'ready';
    }
    
    // Return global status if script loading has already started
    return scriptLoadingStatus;
  });
  
  useEffect(() => {
    // If Google Maps is already loaded or no API key, don't do anything
    if (window.google?.maps) {
      setStatus('ready');
      return;
    }
    
    if (!apiKey) {
      setStatus('error');
      return;
    }
    
    // Don't load script if it's already loading
    if (globalScriptLoadPromise) {
      // Just wait for the existing promise
      globalScriptLoadPromise
        .then(() => setStatus('ready'))
        .catch(() => setStatus('error'));
      return;
    }
    
    console.log('[GoogleMaps] Loading script...');
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}`;
    script.async = true;
    script.defer = true;
    
    // Create promise to track loading
    globalScriptLoadPromise = new Promise<void>((resolve, reject) => {
      script.addEventListener('load', () => {
        console.log('[GoogleMaps] Script loaded successfully');
        scriptLoadingStatus = 'ready';
        setStatus('ready');
        resolve();
      });
      
      script.addEventListener('error', (error) => {
        console.error('[GoogleMaps] Error loading script:', error);
        scriptLoadingStatus = 'error';
        setStatus('error');
        reject(error);
        // Allow retrying on error
        globalScriptLoadPromise = null;
      });
    });
    
    // Add script to document
    document.body.appendChild(script);
    
    // Cleanup
    return () => {
      // Don't remove the script on unmount as it needs to be available globally
    };
  }, [apiKey]);
  
  return status;
};
