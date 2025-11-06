
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
        <path d="M12 4c-3.5 4-3 10.5 0 16" />
        <path d="M12 4c3.5 4 3 10.5 0 16" />
    </svg>
  );
}
