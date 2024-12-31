import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center group gap-2 whitespace-nowrap rounded-full font-medium ring-offset-zinc-50 transition active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-zinc-50 border-2 border-slate-900 active:ring-slate-900 disabled:bg-slate-200 disabled:border-slate-400",
        outline:
          "border-2 border-slate-200 text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900",
        secondary:
          "bg-brand-200 text-brand-700 active:ring-brand-300 hover:bg-brand-200/90 hover:text-brand-900 disabled:bg-slate-100",
        ghost:
          "text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900",
      },
      size: {
        default: "h-10 px-5 has-[svg]:pl-4",
        small: "h-8 px-3 has-[svg]:pl-2",
        large: "h-12 px-6 has-[svg]:pl-4",
      },
      iconOnly: {
        false: null,
        true: null,
      },
    },
    compoundVariants: [
      {
        size: "default",
        iconOnly: true,
        className: "size-10 px-0 [&_svg]:size-6 has-[svg]:pl-0",
      },
      {
        size: "small",
        iconOnly: true,
        className: "size-8 px-0 has-[svg]:pl-0",
      },
      {
        size: "large",
        iconOnly: true,
        className: "size-12 px-0 [&_svg]:size-6 has-[svg]:pl-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      iconOnly: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconOnly,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, iconOnly, className }))}
        ref={ref}
        disabled={disabled}
        {...props}
      >
        {!disabled &&
          (variant === undefined ||
            variant === "default" ||
            variant === null) && (
            <span
              role="presentation"
              className={cn(
                buttonVariants({ variant, size, iconOnly, className }),
                "absolute inset-0 clip-100 group-hover:clip-0 size-auto transition-all duration-200 pointer-events-none text-zinc-100 bg-slate-900 hover:text-zinc-100"
              )}
            >
              {children}
            </span>
          )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
