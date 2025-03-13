
import React from "react";
import Header from "@/components/Header";
import SolarCalculator from "@/components/SolarCalculator";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-solar-gray">
      <div className="container px-4 py-4">
        <Header />
        <main>
          <SolarCalculator />
        </main>
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SolarCalc. All rights reserved.</p>
          <p className="mt-1">Designed with precision and simplicity.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
