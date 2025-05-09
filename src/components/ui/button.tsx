import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import Spinner from "./spinner";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center group gap-2 whitespace-nowrap rounded-full font-medium ring-offset-gray-50 transition active:ring-2 active:ring-offset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:text-slate-400 disabled:pointer-events-none disabled:opacity-70 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-600 text-gray-50 border-2 border-slate-900 active:ring-slate-300 disabled:bg-slate-200 disabled:border-slate-400",
        outline:
          "border-2 border-slate-200 text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900",
        secondary:
          "bg-brand-200 text-brand-700 active:ring-brand-300 hover:bg-brand-200/90 hover:text-brand-900 disabled:bg-slate-100",
        ghost:
          "text-slate-700 active:ring-slate-200 hover:bg-slate-100 hover:text-slate-900",
      },
      size: {
        default: "h-10 px-5 has-[>div>svg,>svg]:pl-4",
        small: "h-8 px-3 has-[>div>svg,>svg]:pl-2",
        large: "h-12 px-6 has-[>div>svg,>svg]:pl-4",
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
        className: "size-10 px-0 [&_svg]:size-6 has-[>div>svg,>svg]:pl-0",
      },
      {
        size: "small",
        iconOnly: true,
        className: "size-8 px-0 has-[>div>svg,>svg]:pl-0",
      },
      {
        size: "large",
        iconOnly: true,
        className: "size-12 px-0 [&_svg]:size-6 has-[>div>svg,>svg]:pl-0",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      iconOnly: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  primaryBgColor?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconOnly,
      loading,
      disabled,
      primaryBgColor = "bg-slate-900",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, iconOnly, className }))}
        ref={ref}
        disabled={disabled || loading}
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
                `clip-100 group-hover:clip-0 pointer-events-none absolute -inset-px m-0 size-auto border-0 ${primaryBgColor} text-gray-100 transition-all duration-300 ease-snap hover:text-gray-100 motion-reduce:transition-none`,
              )}
            >
              {children}
            </span>
          )}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        )}
        <div className={cn("contents", loading && "invisible")}>{children}</div>
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
