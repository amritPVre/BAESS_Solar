
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "@/components/ui/SectionHeader";
import { User, Mail, Phone, Home } from "lucide-react";

interface ClientDetailsProps {
  clientName: string;
  setClientName: (value: string) => void;
  clientEmail: string;
  setClientEmail: (value: string) => void;
  clientPhone: string;
  setClientPhone: (value: string) => void;
  clientAddress: string;
  setClientAddress: (value: string) => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientPhone,
  setClientPhone,
  clientAddress,
  setClientAddress,
}) => {
  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Client Details" 
        description="Enter the client's contact information for the solar proposal"
        icon={<User className="h-6 w-6" />}
      />
      
      <Card className="bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-solar">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-solar" />
                Client Name
              </Label>
              <Input
                id="clientName"
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="border-solar/20 focus-visible:ring-solar"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-solar" />
                Email Address
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="border-solar/20 focus-visible:ring-solar"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-solar" />
                Phone Number
              </Label>
              <Input
                id="clientPhone"
                placeholder="(555) 123-4567"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="border-solar/20 focus-visible:ring-solar"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clientAddress" className="flex items-center gap-2">
                <Home className="h-4 w-4 text-solar" />
                Address
              </Label>
              <Input
                id="clientAddress"
                placeholder="123 Solar St, City, State"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="border-solar/20 focus-visible:ring-solar"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetails;
