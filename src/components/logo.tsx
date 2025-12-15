
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={cn("w-8 h-8", props.className)}
        {...props}
    >
        <title>Dhuwa Logo</title>
        {/* Replace this circle with your own SVG path data */}
        <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
