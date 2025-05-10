
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseUIStateProps {
  showInstructionsDefault?: boolean;
}

export const useUIState = ({ 
  showInstructionsDefault = true 
}: UseUIStateProps = {}) => {
  const [instructionsVisible, setInstructionsVisible] = useState(showInstructionsDefault);
  const [layoutAzimuth, setLayoutAzimuth] = useState<number>(180);
  
  // Handle missing API key warning
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      toast.error('Google Maps API key is missing. Please add it to your environment variables as VITE_GOOGLE_MAPS_API_KEY.');
    }
  }, []);

  return {
    instructionsVisible,
    setInstructionsVisible,
    layoutAzimuth,
    setLayoutAzimuth
  };
};
