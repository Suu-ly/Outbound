"use client";
import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Please check your email!" }),
});

const ForgetPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.forgetPassword(
      {
        email: values.email,
        redirectTo: "/reset-password",
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onError: () => {
          setSubmitted(true);
        },
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  }
  if (submitted)
    return (
      <AuthLayout
        header="Email Sent"
        subtitle="We've sent a password reset link to your email if your account exists. Please check your spam folder if it does not show up!"
      >
        <ButtonLink href="/" className="w-full" size="large">
          Back to Home
        </ButtonLink>
      </AuthLayout>
    );

  return (
    <AuthLayout
      header="Forgot Password"
      subtitle="Just enter your email below and a link to reset your password will be sent to your account."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-3 space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="email@example.com"
                    {...field}
                    type="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            size="large"
            className="mb-3 w-full"
            type="submit"
            loading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>
      </Form>
      <div className="text-center">
        <Link
          href="/login"
          className="whitespace-nowrap rounded-full font-medium text-brand-600 ring-slate-400 ring-offset-2 ring-offset-white transition hover:underline focus-visible:outline-none focus-visible:ring-2"
        >
          Go Back
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgetPasswordForm;
