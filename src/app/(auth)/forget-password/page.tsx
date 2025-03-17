import { Metadata } from "next";
import ForgetPasswordForm from "./forget-password-form";

export const metadata: Metadata = {
  title: "Forget Password - Outbound",
};

export default function ForgetPasswordPage() {
  return <ForgetPasswordForm />;
}
