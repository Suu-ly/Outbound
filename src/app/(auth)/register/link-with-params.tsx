"use client";

import ButtonLink from "@/components/ui/button-link";
import { IconMail } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LinkWithParams() {
  const redirect = useSearchParams().get("redirect");

  return (
    <Link
      href={`/login${redirect ? "?" + new URLSearchParams([["redirect", redirect]]).toString() : ""}`}
      className="whitespace-nowrap rounded-full font-medium text-brand-600 ring-slate-400 ring-offset-2 ring-offset-white transition hover:underline focus-visible:outline-none focus-visible:ring-2"
    >
      Sign In
    </Link>
  );
}

export function EmailLinkWithParams() {
  const redirect = useSearchParams().get("redirect");
  return (
    <ButtonLink
      href={`/register/email${redirect ? "?" + new URLSearchParams([["redirect", redirect]]).toString() : ""}`}
      className="w-full"
      variant="outline"
      size="large"
    >
      <IconMail />
      Register with Email
    </ButtonLink>
  );
}
