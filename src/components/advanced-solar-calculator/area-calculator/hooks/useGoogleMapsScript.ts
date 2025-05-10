
import { useState, useEffect } from 'react';

type ScriptStatus = 'loading' | 'ready' | 'error';

// Define libraries array for Google Maps
const libraries = ["drawing", "geometry", "marker"] as ("drawing" | "geometry" | "places" | "visualization" | "marker")[];

// Track script loading status globally to prevent multiple loads
let scriptLoadingStatus: ScriptStatus = 'loading';
let globalScriptLoadPromise: Promise<void> | null = null;
let scriptElement: HTMLScriptElement | null = null;

export const useGoogleMapsScript = (apiKey: string): ScriptStatus => {
  const [status, setStatus] = useState<ScriptStatus>(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      console.log('[GoogleMaps] Already loaded, returning ready state');
      return 'ready';
    }
    
    // Check if script tag already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('[GoogleMaps] Script tag already exists, returning current status');
      return scriptLoadingStatus;
    }
    
    // Return initial loading state
    return 'loading';
  });
  
  useEffect(() => {
    // If Google Maps is already loaded, nothing to do
    if (window.google?.maps) {
      console.log('[GoogleMaps] Google Maps already loaded');
      setStatus('ready');
      return;
    }
    
    // If no API key, set error
    if (!apiKey) {
      console.error('[GoogleMaps] No API key provided');
      setStatus('error');
      return;
    }
    
    // Don't load script if it's already loading
    if (globalScriptLoadPromise) {
      console.log('[GoogleMaps] Script already loading, waiting for completion');
      // Just wait for the existing promise
      globalScriptLoadPromise
        .then(() => {
          console.log('[GoogleMaps] Existing script load completed');
          setStatus('ready');
        })
        .catch(() => {
          console.error('[GoogleMaps] Existing script load failed');
          setStatus('error');
        });
      return;
    }
    
    // Check if script tag already exists
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      console.log('[GoogleMaps] Script tag already exists, not creating a new one');
      return;
    }
    
    console.log('[GoogleMaps] Loading script...');
    scriptLoadingStatus = 'loading';
    
    // Create script element
    scriptElement = document.createElement('script');
    scriptElement.id = 'google-maps-script';
    scriptElement.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}`;
    scriptElement.async = true;
    scriptElement.defer = true;
    
    // Create promise to track loading
    globalScriptLoadPromise = new Promise<void>((resolve, reject) => {
      if (!scriptElement) return reject('Script element is null');
      
      scriptElement.addEventListener('load', () => {
        console.log('[GoogleMaps] Script loaded successfully');
        scriptLoadingStatus = 'ready';
        setStatus('ready');
        resolve();
      });
      
      scriptElement.addEventListener('error', (error) => {
        console.error('[GoogleMaps] Error loading script:', error);
        scriptLoadingStatus = 'error';
        setStatus('error');
        reject(error);
        // Clear global promise to allow retrying
        globalScriptLoadPromise = null;
        
        // Remove the script tag on error to allow retrying
        if (scriptElement && scriptElement.parentNode) {
          scriptElement.parentNode.removeChild(scriptElement);
          scriptElement = null;
        }
      });
    });
    
    // Add script to document
    document.body.appendChild(scriptElement);
    
    // Cleanup function
    return () => {
      // Don't remove the script on unmount as it needs to be available globally
      // Just clean up our local reference
      scriptElement = null;
    };
  }, [apiKey]);
  
  return status;
};
