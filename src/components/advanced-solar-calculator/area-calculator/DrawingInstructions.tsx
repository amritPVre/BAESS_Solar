
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Mouse, Edit3, Compass, Layers, Lightbulb, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const instructionSteps = [
  {
    icon: <Layers className="h-4 w-4 text-indigo-600" />,
    text: "Select a structure type from the dropdown below",
    color: "from-indigo-500 to-purple-600"
  },
  {
    icon: <Mouse className="h-4 w-4 text-blue-600" />,
    text: "Click a drawing tool button (polygon or rectangle)",
    color: "from-blue-500 to-cyan-600"
  },
  {
    icon: <MapPin className="h-4 w-4 text-emerald-600" />,
    text: "Draw on the map to define your installation area",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: <Layers className="h-4 w-4 text-amber-600" />,
    text: "You can draw multiple areas with different structure types",
    color: "from-amber-500 to-orange-600"
  },
  {
    icon: <Edit3 className="h-4 w-4 text-rose-600" />,
    text: "Areas are editable - drag the points to reshape them",
    color: "from-rose-500 to-pink-600"
  },
  {
    icon: <Compass className="h-4 w-4 text-violet-600" />,
    text: "Click on the edge markers to set the array azimuth",
    color: "from-violet-500 to-purple-600"
  }
];

interface DrawingInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DrawingInstructions: React.FC<DrawingInstructionsProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="pb-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Lightbulb className="h-7 w-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-white">Drawing Instructions</DialogTitle>
                <p className="text-blue-100 text-sm mt-1">Follow these steps to design your solar installation areas</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {instructionSteps.map((step, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-[1.02] overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {step.icon}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">Step {index + 1}</h3>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {step.text}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-emerald-200 rounded-full mt-1">
                <Lightbulb className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 text-lg mb-2">Pro Tips for Optimal Results</h4>
                <ul className="space-y-2 text-emerald-700">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Maintain consistent spacing between modules and avoid placing arrays too close to roof edges or obstacles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Consider shading from nearby buildings, trees, or other structures when positioning arrays</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Each area can have different structure types - design complex installations with mixed mounting systems</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
