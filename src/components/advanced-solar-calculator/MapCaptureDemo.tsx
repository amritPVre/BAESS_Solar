import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Download } from 'lucide-react';
import { toast } from 'sonner';

interface MapCaptureDemoProps {
  capturedMapImage?: string | null;
}

const MapCaptureDemo: React.FC<MapCaptureDemoProps> = ({ capturedMapImage }) => {
  const [localMapImage, setLocalMapImage] = useState<string | null>(capturedMapImage || null);

  const handleDownloadImage = () => {
    if (localMapImage) {
      const link = document.createElement('a');
      link.download = `solar-installation-${new Date().toISOString().split('T')[0]}.png`;
      link.href = localMapImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Map image downloaded successfully!');
    } else {
      toast.error('No map image available to download');
    }
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Captured PV Installation Map</h3>
          {localMapImage && (
            <Button 
              onClick={handleDownloadImage}
              variant="outline" 
              size="sm" 
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Download Map
            </Button>
          )}
        </div>
        
        {localMapImage ? (
          <div className="relative">
            <img 
              src={localMapImage} 
              alt="Solar PV Installation Map" 
              className="w-full h-auto rounded-lg border shadow-sm"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
            <div className="mt-2 text-sm text-muted-foreground text-center">
              Solar panel layout with module placement and installation areas
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No map image captured yet</p>
            <p className="text-sm">Use the "Capture Map" button in the PV Areas section to capture the installation layout</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapCaptureDemo; 