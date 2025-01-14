import AuthLayout from "@/components/auth-layout";
import { redirect } from "next/navigation";
import VerifyOtp from "./verify-otp";

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const email = (await searchParams).email;
  if (!email || Array.isArray(email)) redirect("/login");

  return (
    <AuthLayout
      header="Verify email"
      subtitle="Enter the code below that was sent to your email. Please check your spam folder if it does not show up!"
    >
      <VerifyOtp email={email} />
    </AuthLayout>
  );
}
