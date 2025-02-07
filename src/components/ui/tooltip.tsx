"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, side = "bottom", ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      side={side}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border-2 border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-md animate-in fade-in-0 zoom-in-95 data-[side=bottom]:data-[align=center]:origin-top data-[side=bottom]:data-[align=end]:origin-top-right data-[side=bottom]:data-[align=start]:origin-top-left data-[side=left]:data-[align=center]:origin-right data-[side=left]:data-[align=end]:origin-bottom-right data-[side=left]:data-[align=start]:origin-top-right data-[side=right]:data-[align=center]:origin-left data-[side=right]:data-[align=end]:origin-bottom-left data-[side=right]:data-[align=start]:origin-top-right data-[side=top]:data-[align=center]:origin-bottom data-[side=top]:data-[align=end]:origin-bottom-right data-[side=top]:data-[align=start]:origin-bottom-left data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
