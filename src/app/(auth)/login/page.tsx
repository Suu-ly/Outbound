import AuthLayout from "@/components/auth-layout";
import GithubSignIn from "@/components/github-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconBrandGithub } from "@tabler/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login - Outbound",
};

export default function Login() {
  return (
    <AuthLayout header="Login" subtitle="Login to start planning your trip!">
      <Suspense
        fallback={
          <Button
            variant="secondary"
            size="large"
            className={
              "mb-6 w-full bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90 hover:text-white active:ring-neutral-300"
            }
          >
            <IconBrandGithub />
            Login with Github
          </Button>
        }
      >
        <GithubSignIn className="mb-6">Login with Github</GithubSignIn>
      </Suspense>
      <div className="relative mb-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="relative z-10 bg-white px-2 text-slate-500">Or</span>
      </div>
      <Suspense
        fallback={
          <div className="text-slate-900">
            <div className="mb-3 space-y-6">
              <div className="space-y-1">
                <p className="font-medium">Email</p>
                <Input placeholder="email@example.com" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Password</p>
                <Input />
              </div>
              <Button size="large" className="w-full">
                Login
              </Button>
            </div>
            <div className="text-center">
              Don&apos;t have an account yet?
              <br />
              <Link
                href="/register"
                className="whitespace-nowrap font-medium text-brand-600 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
