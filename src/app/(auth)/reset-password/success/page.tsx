import AuthLayout from "@/components/auth-layout";
import ButtonLink from "@/components/ui/button-link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password Reset Success - Outbound",
};

export default function Login() {
  return (
    <AuthLayout
      header="Password Reset Successfully"
      subtitle="Please use this new password for your future logins!"
    >
      <ButtonLink href="/login" size="large" className="w-full">
        Go to Login
      </ButtonLink>
    </AuthLayout>
  );
}
