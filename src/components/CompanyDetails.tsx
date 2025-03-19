
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "@/components/ui/SectionHeader";
import { Building2, User, Mail, Phone } from "lucide-react";

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
  setCompanyPhone,
}) => {
  return (
    <div className="animate-fade-in" style={{animationDelay: "100ms"}}>
      <SectionHeader 
        title="Company Details" 
        description="Enter your company information for the solar proposal"
        icon={<Building2 className="h-6 w-6" />}
      />
      
      <Card className="bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-all duration-300 border-t-4 border-t-solar-dark">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-solar-dark" />
                Company Name
              </Label>
              <Input
                id="companyName"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="border-solar-dark/20 focus-visible:ring-solar-dark"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyContact" className="flex items-center gap-2">
                <User className="h-4 w-4 text-solar-dark" />
                Contact Person
              </Label>
              <Input
                id="companyContact"
                placeholder="Enter contact name"
                value={companyContact}
                onChange={(e) => setCompanyContact(e.target.value)}
                className="border-solar-dark/20 focus-visible:ring-solar-dark"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-solar-dark" />
                Company Email
              </Label>
              <Input
                id="companyEmail"
                type="email"
                placeholder="contact@company.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                className="border-solar-dark/20 focus-visible:ring-solar-dark"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-solar-dark" />
                Company Phone
              </Label>
              <Input
                id="companyPhone"
                placeholder="(555) 987-6543"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                className="border-solar-dark/20 focus-visible:ring-solar-dark"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDetails;
