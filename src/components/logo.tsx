
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ComponentProps } from "react";

export function Logo(props: Omit<ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) {
  return (
    <Image
      src="/512x512.png"
      alt="Dhuwa Logo"
      width={32}
      height={32}
      {...props}
      className={cn("w-8 h-8", props.className)}
    />
  );
}
