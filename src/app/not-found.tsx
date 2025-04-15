import ButtonLink from "@/components/ui/button-link";
import Image from "next/image";
import Link from "next/link";

export default function Loading() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50 p-4">
      <Link
        href="/"
        className="flex items-baseline gap-1 rounded-full p-1.5 ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        <Image src="/outbound.svg" width={20} height={20} alt="outbound" />
        <h1 className="hidden font-display text-3xl font-semibold leading-5 text-brand-900 sm:inline">
          Outbound
        </h1>
      </Link>
      <h1 className="mt-4 text-center font-display text-5xl font-semibold text-slate-900 sm:text-7xl">
        Page not found
      </h1>
      <p className="text-center text-lg font-medium text-gray-500 sm:text-xl">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <ButtonLink href="/" size="large" className="mt-8">
        Go Back Home
      </ButtonLink>
    </main>
  );
}
