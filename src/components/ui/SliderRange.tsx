
import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

interface SliderRangeProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  value: number;
  onChange: (value: number) => void;
}

export const SliderRange: React.FC<SliderRangeProps> = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderRangeProps
>(({ className, value, onChange, ...props }, ref) => {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={[value]}
      onValueChange={handleValueChange}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-100">
        <SliderPrimitive.Range className="absolute h-full bg-blue-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-blue-500 bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});

SliderRange.displayName = "SliderRange";

export const SliderOutput: React.FC<{value: number}> = ({ value }) => {
  return (
    <div className="w-12 text-center text-sm font-medium">
      {value}
    </div>
  );
};
