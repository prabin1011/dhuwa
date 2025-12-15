
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ComponentProps } from "react";

export function Logo(props: Omit<ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) {
  return (
    <Image
      src="/logo.png"
      alt="Dhuwa Logo"
      width={96}
      height={96}
      {...props}
      className={cn("w-8 h-8", props.className)}
    />
  );
}
