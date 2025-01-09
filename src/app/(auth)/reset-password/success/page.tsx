import AuthLayout from "@/components/auth-layout";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function Login() {
  return (
    <AuthLayout
      header="Password Reset Successfully"
      subtitle="Please use this new password for your future logins!"
    >
      <Link
        href="/login"
        className={buttonVariants({ size: "large", className: "w-full" })}
      >
        Go to Login
      </Link>
    </AuthLayout>
  );
}
