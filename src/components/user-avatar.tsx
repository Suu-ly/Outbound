"use client";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Skeleton from "./ui/skeleton";

export default function UserAvatar() {
  const { data: session, isPending } = authClient.useSession();

  if (!session || isPending)
    return <Skeleton className="size-8 rounded-full" />;

  return (
    <Avatar>
      <AvatarImage src={session.user.image ?? undefined} />
      <AvatarFallback>
        {session.user.name.substring(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
