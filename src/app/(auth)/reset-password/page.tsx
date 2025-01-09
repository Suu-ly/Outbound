import AuthLayout from "@/components/auth-layout";
import PasswordReset from "./password-reset";

export default function Register() {
  return (
    <AuthLayout header="Reset Password">
      <PasswordReset />
    </AuthLayout>
  );
}
