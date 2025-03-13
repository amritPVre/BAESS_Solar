
import React from "react";
import { Sun } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="w-full flex items-center justify-between py-4 mb-8">
      <div className="flex items-center space-x-2">
        <Sun className="h-8 w-8 text-solar-accent animate-float" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SolarCalc</h1>
          <p className="text-sm text-muted-foreground">Financial analysis for solar investments</p>
        </div>
      </div>
      <div className="hidden md:flex space-x-4">
        <a href="#" className="text-sm font-medium hover:text-solar transition-colors">Documentation</a>
        <a href="#" className="text-sm font-medium hover:text-solar transition-colors">About</a>
        <a href="#" className="text-sm font-medium hover:text-solar transition-colors">Contact</a>
      </div>
    </header>
  );
};

export default Header;
