"use client";

import { authClient } from "@/lib/authClient";
import { cn } from "@/lib/utils";
import { IconBrandGithub } from "@tabler/icons-react";
import { Button } from "./ui/button";

const GithubSignIn = ({
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
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
          callbackURL: "/",
        });
      }}
      {...rest}
    >
      <IconBrandGithub />
      Register with Github
    </Button>
  );
};

export default GithubSignIn;
