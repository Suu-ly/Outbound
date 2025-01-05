import { Button } from "@/components/ui/button";
import { IconBrandGithub } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";

export default function Login() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-12 bg-zinc-50 p-4">
      <div className="flex items-baseline gap-2">
        <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
        <h1 className="font-display text-4xl font-semibold text-brand-900">
          Outbound
        </h1>
      </div>
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6">
        <div>
          <h1 className="mb-3 font-display text-2xl font-semibold md:text-3xl">
            Login
          </h1>
          Login to start planning your trip!
        </div>
        <Button
          variant="secondary"
          size="large"
          className="w-full bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90 hover:text-white active:ring-neutral-300"
        >
          <IconBrandGithub />
          Continue with Github
        </Button>
        <div>
          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="relative z-10 bg-white px-2 text-slate-500">
              Or
            </span>
          </div>
        </div>
        <div>
          <Button size="large" className="mb-3 w-full">
            Login
          </Button>
          <div className="text-center">
            Don&apos;t have an account yet?
            <br />
            <Link href="/register" className="font-medium hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
