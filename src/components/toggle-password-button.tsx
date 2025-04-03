"use client";

import { IconEye, IconEyeClosed } from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";
import { Button } from "./ui/button";

export default function TogglePasswordButton({
  showPassword,
  setShowPassword,
}: {
  showPassword: boolean;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Button
      size="small"
      iconOnly
      variant="ghost"
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label="Toggle password visibility"
    >
      {showPassword ? <IconEyeClosed /> : <IconEye />}
    </Button>
  );
}
