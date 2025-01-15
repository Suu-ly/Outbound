import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { buttonVariants } from "./button";

import { cn } from "@/lib/utils";
import Link from "next/link";

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  href: string;
}

const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, iconOnly, children, href, ...props }, ref) => {
    return (
      <Link
        className={cn(buttonVariants({ variant, size, iconOnly, className }))}
        ref={ref}
        href={href}
        {...props}
      >
        {(variant === undefined ||
          variant === "default" ||
          variant === null) && (
          <span
            role="presentation"
            className={cn(
              buttonVariants({ variant, size, iconOnly, className }),
              "clip-100 group-hover:clip-0 pointer-events-none absolute inset-0 m-0 size-auto border-0 bg-slate-900 text-zinc-100 transition-all duration-200 hover:text-zinc-100",
            )}
          >
            {children}
          </span>
        )}
        {children}
      </Link>
    );
  },
);
ButtonLink.displayName = "Link";

export default ButtonLink;
