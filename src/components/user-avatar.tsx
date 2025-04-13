"use client";

import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Skeleton from "./ui/skeleton";

export default function UserAvatar() {
  const { data: session, isPending } = authClient.useSession();

  if (!session || isPending)
    return <Skeleton className="size-8 rounded-full" />;

  return (
    <Link
      href="/account"
      className="rounded-full ring-slate-400 ring-offset-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Avatar>
        <AvatarImage src={session.user.image ?? undefined} />
        <AvatarFallback>
          {session.user.name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
