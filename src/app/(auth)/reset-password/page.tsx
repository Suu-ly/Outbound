import AuthLayout from "@/components/auth-layout";
import { redirect } from "next/navigation";
import PasswordReset from "./password-reset";

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const error = params.error;
  if (error || !token || Array.isArray(token)) redirect("/");
  return (
    <AuthLayout header="Reset Password">
      <PasswordReset />
    </AuthLayout>
  );
}
