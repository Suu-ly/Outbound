"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as React from "react";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={cn(
        "z-50 w-72 rounded-xl border-2 border-slate-200 bg-white p-4 shadow-md outline-none data-[side=bottom]:data-[align=center]:origin-top data-[side=bottom]:data-[align=end]:origin-top-right data-[side=bottom]:data-[align=start]:origin-top-left data-[side=left]:data-[align=center]:origin-right data-[side=left]:data-[align=end]:origin-bottom-right data-[side=left]:data-[align=start]:origin-top-right data-[side=right]:data-[align=center]:origin-left data-[side=right]:data-[align=end]:origin-bottom-left data-[side=right]:data-[align=start]:origin-top-right data-[side=top]:data-[align=center]:origin-bottom data-[side=top]:data-[align=end]:origin-bottom-right data-[side=top]:data-[align=start]:origin-bottom-left data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };
