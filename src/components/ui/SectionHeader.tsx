
import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  icon,
  className,
}) => {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className="text-solar">{icon}</div>}
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {description && (
        <p className="text-muted-foreground text-base max-w-3xl">{description}</p>
      )}
    </div>
  );
};

export default SectionHeader;
