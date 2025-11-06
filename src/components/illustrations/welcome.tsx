import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function WelcomeIllustration(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            className={cn("w-64 h-64", props.className)}
            {...props}
        >
            <defs>
                <linearGradient id="gradWhite" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "white", stopOpacity: 0.5 }} />
                    <stop offset="100%" style={{ stopColor: "white", stopOpacity: 0.1 }} />
                </linearGradient>
            </defs>

            {/* Background elements */}
            <rect x="50" y="80" width="100" height="15" rx="7.5" fill="white" opacity="0.2" />
            <rect x="50" y="105" width="100" height="15" rx="7.5" fill="white" opacity="0.1" />

            {/* Main Logo Group */}
            <g transform="translate(100, 100) scale(1.2)">
                <circle cx="0" cy="0" r="40" fill="hsl(var(--primary))" opacity="0.9" />
                <circle cx="0" cy="0" r="30" fill="hsl(215, 70%, 65%)" />
                <path
                    d="M 0 -35 A 35 35 0 0 1 35 0 L 0 0 Z"
                    fill="url(#gradWhite)"
                />
                 <path
                    d="M 0 -35 A 35 35 0 0 1 35 0 L 0 0 Z"
                    fill="url(#gradWhite)"
                    transform="rotate(90)"
                />
                 <path
                    d="M 0 -35 A 35 35 0 0 1 35 0 L 0 0 Z"
                    fill="url(#gradWhite)"
                    transform="rotate(180)"
                />
                 <path
                    d="M 0 -35 A 35 35 0 0 1 35 0 L 0 0 Z"
                    fill="url(#gradWhite)"
                    transform="rotate(270)"
                />

                {/* Black flame/leaf shape */}
                <path
                    d="M 0 -25 C 20 -10, 20 10, 0 25 C -20 10, -20 -10, 0 -25 Z"
                    transform="rotate(-20)"
                    fill="hsl(var(--background))"
                />
            </g>
             {/* Large background circle */}
            <circle cx="90" cy="140" r="50" fill="hsl(var(--card))" />
        </svg>
    )
}
