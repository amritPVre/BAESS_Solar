
import React from "react";
import { motion } from "framer-motion";
import { Zap, Brain, Rocket } from "lucide-react";

const AuthInfoPanel: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden md:flex flex-col justify-center p-8"
    >
      <div className="flex flex-col items-center mb-12">
        <img 
          src="/BAESS_logo_v02.png" 
          alt="BAESS Labs" 
          className="h-24 w-auto" 
          onError={(e) => e.currentTarget.style.display = 'none'} 
        />
      </div>
      
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[#0A2463] via-[#1976D2] to-[#FFA500] bg-clip-text text-transparent">
        Welcome Back
      </h1>
      <p className="text-base text-gray-600 mb-12">
        AI-powered solar design platform
      </p>
      
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">AI Design</p>
            <p className="text-xs text-gray-600">Intelligent simulation</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Fast Analysis</p>
            <p className="text-xs text-gray-600">Real-time calculations</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/50"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Pro Reports</p>
            <p className="text-xs text-gray-600">Export-ready docs</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AuthInfoPanel;
