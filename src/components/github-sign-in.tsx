"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { IconBrandGithub } from "@tabler/icons-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";

const GithubSignIn = ({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const [isLoading, setIsLoading] = useState(false);
  const redirect = useSearchParams().get("redirect");
  return (
    <Button
      variant="secondary"
      size="large"
      className={cn(
        "w-full bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90 hover:text-white active:ring-neutral-300",
        className,
      )}
      onClick={async () => {
        await authClient.signIn.social({
          provider: "github",
          callbackURL: redirect ? redirect : "/",
          fetchOptions: {
            onRequest: () => {
              setIsLoading(true);
            },
            onError: (ctx) => {
              setIsLoading(false);
              toast.error(ctx.error.message);
            },
          },
        });
      }}
      loading={isLoading}
      {...rest}
    >
      <IconBrandGithub />
      {children}
    </Button>
  );
};

export default GithubSignIn;
