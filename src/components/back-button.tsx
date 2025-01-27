"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size="small"
      className={className}
      onClick={() => router.back()}
    >
      <IconArrowLeft />
      Back
    </Button>
  );
}
