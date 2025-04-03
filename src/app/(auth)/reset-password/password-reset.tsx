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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z
  .object({
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

export default function PasswordReset() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirm: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    await authClient.resetPassword(
      {
        newPassword: values.password,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          router.push("/reset-password/success");
        },
        onError: (ctx) => {
          setIsLoading(false);
          toast.error(ctx.error.message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
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
          className="mb-3 w-full"
          type="submit"
          loading={isLoading}
        >
          Reset Password
        </Button>
      </form>
    </Form>
  );
}
