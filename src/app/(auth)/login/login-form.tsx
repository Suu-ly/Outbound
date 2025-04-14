"use client";
import TogglePasswordButton from "@/components/toggle-password-button";
import { Button } from "@/components/ui/button";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().trim().email({ message: "Please check your email!" }),
  password: z
    .string({ required_error: "Please enter a password!" })
    .min(1, { message: "Please enter a password!" }),
});

const LoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const redirect = useSearchParams().get("redirect");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
        callbackURL: redirect ? redirect : "/",
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onError: (ctx) => {
          setIsLoading(false);
          if (ctx.error.message === "Email not verified") {
            authClient.emailOtp.sendVerificationOtp({
              email: values.email,
              type: "email-verification",
            });
            const formattedEmail = new URLSearchParams();
            formattedEmail.set("email", values.email);
            router.push("/verify?" + formattedEmail.toString());
          } else if (ctx.error.message === "Invalid email or password") {
            form.setError(
              "password",
              { type: "validate", message: "Invalid email or password" },
              { shouldFocus: true },
            );
          } else {
            toast.error(ctx.error.message);
          }
        },
      },
    );
  }

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="text-slate-900">
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forget-password"
                    className="rounded-full font-medium ring-slate-400 ring-offset-2 ring-offset-white transition hover:underline focus-visible:outline-none focus-visible:ring-2"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    right={
                      <TogglePasswordButton
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                      />
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            size="large"
            className="w-full"
            type="submit"
            loading={isLoading}
          >
            Login
          </Button>
        </form>
      </Form>
      <div className="text-center">
        Don&apos;t have an account yet?
        <br />
        <Link
          href={`/register${redirect ? "?" + new URLSearchParams([["redirect", redirect]]).toString() : ""}`}
          className="whitespace-nowrap rounded-full font-medium text-brand-600 ring-slate-400 ring-offset-2 ring-offset-white transition hover:underline focus-visible:outline-none focus-visible:ring-2"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;
