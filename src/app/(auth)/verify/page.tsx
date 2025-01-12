import AuthLayout from "@/components/auth-layout";
import VerifyOtp from "./verify-otp";

export default function Register() {
  return (
    <AuthLayout
      header="Verify email"
      subtitle="Enter the code below that was sent to your email account."
    >
      <VerifyOtp />
    </AuthLayout>
  );
}
