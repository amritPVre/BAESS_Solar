
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GoogleMapsKeyInputProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export const GoogleMapsKeyInput: React.FC<GoogleMapsKeyInputProps> = ({ 
  onApiKeySubmit 
}) => {
  const [apiKey, setApiKey] = useState<string>("");

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid Google Maps API key");
      return;
    }
    
    // Save API key to sessionStorage
    sessionStorage.setItem("gmapsApiKey", apiKey);
    onApiKeySubmit(apiKey);
    toast.success("API key saved");
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white z-20">
      <div className="max-w-md w-full space-y-4 text-center">
        <h3 className="text-lg font-medium">Google Maps API Key Required</h3>
        <p className="text-sm text-muted-foreground">
          To use the Solar Designer tool, you need a Google Maps API key with Maps JavaScript API and Places API enabled.
        </p>
        <div className="flex flex-col space-y-3">
          <Input
            type="text"
            placeholder="Enter your Google Maps API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full"
          />
          <Button onClick={handleApiKeySubmit}>
            Apply API Key
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          <p>To get an API key:</p>
          <ol className="text-left list-decimal pl-5 mt-2 space-y-1">
            <li>Go to the <a href="https://console.cloud.google.com/google/maps-apis/overview" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
            <li>Create a project or select an existing one</li>
            <li>Enable the Maps JavaScript API and Places API</li>
            <li>Create an API key and copy it here</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
