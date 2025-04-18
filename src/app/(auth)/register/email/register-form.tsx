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

const formSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters long!" }),
    email: z.string().email({ message: "Please check your email!" }),
    password: z
      .string({ required_error: "Please enter a password!" })
      .min(8, {
        message: "The password needs to be at least 8 characters long!",
      })
      .max(128, { message: "The password is too long!" }),
    confirm: z
      .string({ required_error: "Please confirm your password!" })
      .min(1, { message: "Please confirm your password!" }),
  })
  .refine((values) => values.confirm === values.password, {
    message: "Passwords are not the same!",
    path: ["confirm"],
  });

export default function RegisterEmailForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const redirect = useSearchParams().get("redirect");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          const formattedEmail = new URLSearchParams();
          formattedEmail.set("email", values.email);
          if (redirect) formattedEmail.set("redirect", redirect);
          router.push("/verify?" + formattedEmail.toString());
        },
        onError: (ctx) => {
          setIsLoading(false);
          if (ctx.error.message === "User already exists") {
            form.setError(
              "email",
              {
                type: "validate",
                message: "This email is already registered!",
              },
              { shouldFocus: true },
            );
          } else {
            toast.error(ctx.error.message);
          }
        },
      },
    );
  }

  return (
    <div className="text-slate-900">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mb-3 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                <FormLabel>Password</FormLabel>
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
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
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
            Register
          </Button>
        </form>
      </Form>
      <div className="text-center">
        <Link
          className="whitespace-nowrap rounded-full font-medium text-brand-600 ring-slate-400 ring-offset-2 ring-offset-white transition hover:underline focus-visible:outline-none focus-visible:ring-2"
          href={`/register${redirect ? "?" + new URLSearchParams([["redirect", redirect]]).toString() : ""}`}
        >
          Go Back
        </Link>
      </div>
    </div>
  );
}
