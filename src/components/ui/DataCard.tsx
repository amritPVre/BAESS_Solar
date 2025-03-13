
import React from "react";
import { cn } from "@/lib/utils";

interface DataCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  titleClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon,
  className,
  valueClassName,
  titleClassName,
  iconClassName,
  onClick
}) => {
  return (
    <div
      className={cn(
        "result-card bg-white group transition-all duration-300 hover:shadow-lg",
        onClick ? "cursor-pointer" : "",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className={cn("mb-2 text-solar", iconClassName)}>
          {icon}
        </div>
      )}
      <h3 className={cn("text-sm font-medium text-muted-foreground mb-1", titleClassName)}>
        {title}
      </h3>
      <p className={cn("text-2xl font-semibold", valueClassName)}>
        {value}
      </p>
    </div>
  );
};

export default DataCard;
