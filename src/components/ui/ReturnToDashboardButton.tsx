
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface ReturnToDashboardButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const ReturnToDashboardButton: React.FC<ReturnToDashboardButtonProps> = ({ 
  className = "",
  variant = "outline",
  size = "default"
}) => {
  return (
    <Link to="/dashboard">
      <Button variant={variant} size={size} className={`flex items-center gap-2 ${className}`}>
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Button>
    </Link>
  );
};

export default ReturnToDashboardButton;
