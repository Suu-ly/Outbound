import { Metadata } from "next";
import RegisterEmailForm from "./register-form";

export const metadata: Metadata = {
  title: "Register with Email - Outbound",
};

export default function RegisterEmailPage() {
  return <RegisterEmailForm />;
}
