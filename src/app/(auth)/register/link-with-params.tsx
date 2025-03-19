"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconMail } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LinkWithParams() {
  const redirect = useSearchParams().get("redirect");

  return (
    <Link
      href={`/login${redirect ? "?" + new URLSearchParams([["redirect", redirect]]).toString() : ""}`}
      className="whitespace-nowrap font-medium text-brand-600 hover:underline"
    >
      Sign In
    </Link>
  );
}

export function EmailLinkWithParams() {
  const redirect = useSearchParams().get("redirect");
  return (
    <Link
      href={`/register/email${redirect ? "?" + new URLSearchParams([["redirect", redirect]]).toString() : ""}`}
      className={cn(
        buttonVariants({
          size: "large",
          variant: "outline",
          className: "w-full",
        }),
      )}
    >
      <IconMail />
      Register with Email
    </Link>
  );
}
