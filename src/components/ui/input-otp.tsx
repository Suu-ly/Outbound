"use client";

import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp";
import * as React from "react";

import { cn } from "@/lib/utils";
import { IconPointFilled } from "@tabler/icons-react";

const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(
  (
    { className, containerClassName, pattern = REGEXP_ONLY_DIGITS, ...props },
    ref,
  ) => (
    <OTPInput
      ref={ref}
      pattern={pattern}
      containerClassName={cn(
        "flex items-center gap-1 sm:gap-2 has-[:disabled]:opacity-70 group",
        containerClassName,
      )}
      className={cn("disabled:pointer-events-none", className)}
      {...props}
    />
  ),
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex size-9 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-slate-900 transition-colors group-has-[input:disabled]:bg-slate-100 group-has-[input:disabled]:text-slate-400 sm:size-12 sm:rounded-xl",
        isActive && "border-slate-900",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-slate-950 duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ComponentRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <IconPointFilled />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
