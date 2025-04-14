"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { serverNavigate } from "@/server/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  otp: z
    .string({ required_error: "Please enter your otp!" })
    .length(6, { message: "Please enter a valid OTP!" }),
});

export default function VerifyOtp({ email }: { email: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const redirect = useSearchParams().get("redirect");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [countdown]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    authClient.emailOtp.verifyEmail(
      {
        email: email!,
        otp: values.otp,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onError: (ctx) => {
          setIsLoading(false);
          form.setValue("otp", "");
          if (ctx.error.message === "otp expired") {
            form.setError(
              "otp",
              { type: "validate", message: "OTP has expired!" },
              { shouldFocus: true },
            );
          } else if (ctx.error.message === "invalid otp") {
            form.setError(
              "otp",
              { type: "validate", message: "Please enter a valid OTP!" },
              { shouldFocus: true },
            );
          } else {
            toast.error(ctx.error.message);
          }
        },
        onSuccess: () => {
          toast.success("Email successfully verified!");
          if (redirect) serverNavigate(redirect);
          else serverNavigate("/");
        },
      },
    );
  }

  const sendOTP = () => {
    setCountdown(120);
    authClient.emailOtp.sendVerificationOtp({
      email: email,
      type: "email-verification",
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-6 space-y-6">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="sr-only">Enter your code</FormLabel>
                <div className="flex justify-center">
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      onComplete={form.handleSubmit(onSubmit)}
                      disabled={isLoading}
                      {...field}
                    >
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTP>
                  </FormControl>
                </div>
                <FormMessage className="mt-3 text-center" />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <Button
        variant="ghost"
        onClick={sendOTP}
        className="w-full"
        disabled={countdown > 0 || isLoading}
      >
        {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
      </Button>
    </>
  );
}
