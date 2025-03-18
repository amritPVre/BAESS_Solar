
import React from "react";
import { motion } from "framer-motion";
import { Sun, Info } from "lucide-react";

const AuthInfoPanel: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col justify-center p-6 hidden md:flex"
    >
      <div className="flex items-center mb-6">
        <Sun className="h-10 w-10 text-solar mr-4" />
        <h1 className="text-3xl font-bold">Solar Financial Calculator</h1>
      </div>
      
      <h2 className="text-2xl font-semibold mb-4">Welcome to our platform!</h2>
      <p className="text-lg text-gray-600 mb-6">
        Sign in to save your projects, track your calculations, and generate professional reports for your solar investments.
      </p>
      
      <div className="bg-solar-light rounded-lg p-4 mb-6 border border-solar/20">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-solar mr-2 mt-0.5" />
          <p className="text-sm text-gray-700">
            All your data is securely stored and you'll be able to access your projects from any device after signing in.
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-solar-light flex items-center justify-center mr-3">
            <span className="text-solar font-semibold">1</span>
          </div>
          <p>Design your solar system with custom parameters</p>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-solar-light flex items-center justify-center mr-3">
            <span className="text-solar font-semibold">2</span>
          </div>
          <p>Calculate financial metrics and environmental impact</p>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-solar-light flex items-center justify-center mr-3">
            <span className="text-solar font-semibold">3</span>
          </div>
          <p>Export professional reports for clients</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AuthInfoPanel;
