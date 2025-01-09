import AuthLayout from "@/components/auth-layout";
import GithubSignIn from "@/components/github-sign-in";
import LoginForm from "./loginForm";

export default function Login() {
  return (
    <AuthLayout header="Login" subtitle="Login to start planning your trip!">
      <GithubSignIn className="mb-6" />
      <div className="relative mb-6 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="relative z-10 bg-white px-2 text-slate-500">Or</span>
      </div>
      <LoginForm />
    </AuthLayout>
  );
}
