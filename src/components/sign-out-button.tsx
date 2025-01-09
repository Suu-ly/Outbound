"use client";

import { authClient } from "@/lib/auth-client";
import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

const SignOutButton = () => {
  const [inProgress, setInProgress] = useState(false);
  const router = useRouter();

  const signout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          setInProgress(true);
        },
        onError(context) {
          setInProgress(false);
          toast.error(context.error.message);
        },
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };
  return (
    <Button variant="outline" onClick={signout} loading={inProgress}>
      <IconLogout />
      Sign Out
    </Button>
  );
};

export default SignOutButton;
