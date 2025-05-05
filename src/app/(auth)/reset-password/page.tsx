import AuthLayout from "@/components/auth-layout";
import ButtonLink from "@/components/ui/button-link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import PasswordReset from "./password-reset";

export const metadata: Metadata = {
  title: "Reset Password - Outbound",
};

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const error = params.error;
  if (!error && (!token || Array.isArray(token))) redirect("/");

  if (error)
    return (
      <AuthLayout
        header="Invalid Link"
        subtitle="This link has already been used or is no longer active. If you still need to reset your password, please request a new link!"
      >
        <ButtonLink href="/" size="large" className="w-full">
          Back to Home
        </ButtonLink>
      </AuthLayout>
    );

  return (
    <AuthLayout header="Reset Password">
      <PasswordReset />
    </AuthLayout>
  );
}
