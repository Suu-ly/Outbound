import AuthLayout from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import RegisterEmailForm from "./register-form";

export const metadata: Metadata = {
  title: "Register with Email - Outbound",
};

export default function RegisterEmailPage() {
  return (
    <AuthLayout
      header="Register"
      subtitle="Create an account and start planning your trips!"
    >
      <Suspense
        fallback={
          <div className="text-slate-900">
            <div className="mb-3 space-y-6">
              <div className="space-y-1">
                <p className="font-medium">Name</p>
                <Input placeholder="Enter name" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Email</p>
                <Input placeholder="email@example.com" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Password</p>
                <Input />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Confirm Password</p>
                <Input />
              </div>
              <Button size="large" className="w-full">
                Register
              </Button>
            </div>
            <div className="text-center">
              <Link
                className="whitespace-nowrap font-medium text-brand-600 hover:underline"
                href="/register"
              >
                Go Back
              </Link>
            </div>
          </div>
        }
      >
        <RegisterEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
