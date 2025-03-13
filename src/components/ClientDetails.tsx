
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  setClientAddress
}) => {
  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title">Client Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Name</Label>
          <Input
            id="clientName"
            placeholder="John Doe"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientEmail">Email</Label>
          <Input
            id="clientEmail"
            placeholder="john@example.com"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientPhone">Phone</Label>
          <Input
            id="clientPhone"
            placeholder="(123) 456-7890"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientAddress">Address</Label>
          <Input
            id="clientAddress"
            placeholder="123 Solar Street"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
