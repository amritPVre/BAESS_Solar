
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyDetailsProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  companyContact: string;
  setCompanyContact: (value: string) => void;
  companyEmail: string;
  setCompanyEmail: (value: string) => void;
  companyPhone: string;
  setCompanyPhone: (value: string) => void;
}

const CompanyDetails: React.FC<CompanyDetailsProps> = ({
  companyName,
  setCompanyName,
  companyContact,
  setCompanyContact,
  companyEmail,
  setCompanyEmail,
  companyPhone,
  setCompanyPhone
}) => {
  return (
    <div className="glass-card rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
      <h2 className="section-title">Company Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            placeholder="Solar Solutions Inc."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyContact">Contact Person</Label>
          <Input
            id="companyContact"
            placeholder="Jane Smith"
            value={companyContact}
            onChange={(e) => setCompanyContact(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyEmail">Email</Label>
          <Input
            id="companyEmail"
            placeholder="contact@solarsolutions.com"
            type="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyPhone">Phone</Label>
          <Input
            id="companyPhone"
            placeholder="(987) 654-3210"
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
