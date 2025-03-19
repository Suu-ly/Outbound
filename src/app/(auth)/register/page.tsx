import AuthLayout from "@/components/auth-layout";
import GithubSignIn from "@/components/github-sign-in";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconBrandGithub, IconMail } from "@tabler/icons-react";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmailLinkWithParams, LinkWithParams } from "./link-with-params";

export const metadata: Metadata = {
  title: "Register - Outbound",
};

export default function Register() {
  return (
    <AuthLayout
      header="Register"
      subtitle="Create an account and start planning your trips!"
    >
      <div className="mb-6 space-y-2">
        <Suspense
          fallback={
            <Button
              variant="secondary"
              size="large"
              className={
                "w-full bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90 hover:text-white active:ring-neutral-300"
              }
            >
              <IconBrandGithub />
              Register with Github
            </Button>
          }
        >
          <GithubSignIn>Register with Github</GithubSignIn>
        </Suspense>
        <Suspense
          fallback={
            <Link
              href="/registe/email"
              className={buttonVariants({
                size: "large",
                variant: "outline",
                className: "w-full",
              })}
            >
              <IconMail />
              Register with Email
            </Link>
          }
        >
          <EmailLinkWithParams />
        </Suspense>
      </div>
      <div className="text-center">
        Already have an account?
        <br />
        <Suspense
          fallback={
            <Link
              href="/login"
              className="whitespace-nowrap font-medium text-brand-600 hover:underline"
            >
              Sign In
            </Link>
          }
        >
          <LinkWithParams />
        </Suspense>
      </div>
    </AuthLayout>
  );
}
