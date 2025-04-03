"use client";

import TogglePasswordButton from "@/components/toggle-password-button";
import DrawerDialog from "@/components/ui/drawer-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { updateAvatar, updatePassword, updateUserName } from "@/server/actions";
import { IconEdit, IconPhoto } from "@tabler/icons-react";
import { User } from "better-auth";
import { KeyboardEvent, ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const AVATAR_SIZE = 128;

export function AvatarEdit({
  user,
  children,
}: {
  user: User;
  children: ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarContent, setAvatarContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    if (file.type === "image/svg+xml") {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
    reader.onloadend = () => {
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingQuality = "high";
      ctx.imageSmoothingEnabled = true;
      // Fill background
      ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);

      // Load image
      const img = new Image();
      img.onload = () => {
        const height = img.height;
        const width = img.width;

        if (width > height) {
          ctx.drawImage(
            img,
            AVATAR_SIZE * (1 - width / height) * 0.5,
            0,
            (AVATAR_SIZE * width) / height,
            AVATAR_SIZE,
          );
        } else {
          ctx.drawImage(
            img,
            0,
            AVATAR_SIZE * (1 - height / width) * 0.5,
            AVATAR_SIZE,
            (AVATAR_SIZE * height) / width,
          );
        }
        setIsLoading(false);
        setAvatarContent(canvas.toDataURL("image/jpeg"));
      };
      img.src = reader.result as string;
    };
  };

  const handleImageSave = async () => {
    if (!avatarContent) return false;
    setIsSaving(true);
    const res = await updateAvatar(avatarContent);
    setIsSaving(false);
    if (res.status === "error") {
      toast.error(res.message);
      return false;
    }
    toast.success("Avatar updated successfully!");
    return true;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.code === "Space" || e.code === "Enter") e.currentTarget.click();
  };

  return (
    <DrawerDialog
      header="Edit avatar"
      description="Change your publicly visible avatar."
      loading={isSaving}
      mainActionLabel="Save"
      onMainAction={async (close) => {
        const success = await handleImageSave();
        if (success) close();
      }}
      content={
        <div className="flex justify-center">
          {user.image ? (
            <div className="group relative isolate overflow-hidden rounded-full border-2 border-slate-200 ring-slate-400 transition-shadow has-[label:focus-visible]:ring-2 has-[label:focus-visible]:ring-offset-2">
              <label
                aria-label="Edit user avatar"
                tabIndex={0}
                autoFocus
                onKeyDown={handleKeyDown}
                className="absolute z-10 flex size-full cursor-pointer items-center justify-center bg-slate-950/70 text-slate-50 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <IconEdit />
                <Input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                  className="hidden"
                />
              </label>
              <img
                src={avatarContent ? avatarContent : user.image}
                alt="Avatar preview"
                className="size-32 overflow-hidden rounded-full"
              />
            </div>
          ) : (
            <label
              htmlFor="avatar-input"
              className="w-full cursor-pointer rounded-lg ring-slate-400 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              autoFocus
              tabIndex={0}
              onKeyDown={handleKeyDown}
            >
              <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-slate-200 py-3 pl-4 pr-6 transition-colors hover:bg-slate-100">
                {isLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <IconPhoto /> Select image
                  </>
                )}
              </div>
              <Input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                hidden
                className="hidden"
              />
            </label>
          )}
        </div>
      }
    >
      {children}
    </DrawerDialog>
  );
}

export function EditNameDialog({
  currentName,
  children,
}: {
  currentName: string;
  children: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUserNameChange = async () => {
    if (!inputRef.current || inputRef.current.value.trim().length < 2 || error)
      return false;
    if (inputRef.current.value.trim() === currentName) return true;
    setIsLoading(true);
    const res = await updateUserName(inputRef.current.value.trim());
    setIsLoading(false);
    if (res.status === "error") {
      toast.error(res.message);
      return false;
    }
    toast.success("Name updated successfully!");
    return true;
  };

  return (
    <DrawerDialog
      loading={isLoading}
      header="Edit name"
      description="Change your publicly visible name."
      mainActionLabel="Save"
      onMainAction={async (close) => {
        const success = await handleUserNameChange();
        if (success) close();
      }}
      content={
        <>
          <Input
            defaultValue={currentName}
            type="text"
            ref={inputRef}
            onChange={(e) => {
              if (e.currentTarget.value.trim().length < 2)
                setError("Name must be at least 2 characters!");
              else setError("");
            }}
            disabled={isLoading}
          />
          <span className="mt-2 block text-sm font-medium text-red-500">
            {error}
          </span>
        </>
      }
    >
      {children}
    </DrawerDialog>
  );
}

const newPasswordSchema = z
  .object({
    current: z
      .string()
      .min(1, { message: "Please enter your current password!" }),
    password: z
      .string()
      .min(8, {
        message: "The password needs to be at least 8 characters long!",
      })
      .max(128, { message: "The password is too long!" }),
    confirm: z.string().min(1, { message: "Please confirm your password!" }),
  })
  .refine((values) => values.confirm === values.password, {
    message: "Passwords are not the same!",
    path: ["confirm"],
  })
  .refine((values) => values.current !== values.password, {
    message: "New password cannot be the same as old password!",
    path: ["password"],
  });

export function EditPasswordDialog({ children }: { children: ReactNode }) {
  const currentRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cfmRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{
    current?: string[];
    password?: string[];
    confirm?: string[];
  }>();

  const handleUserPasswordChange = async () => {
    if (!inputRef.current || !cfmRef.current || !currentRef.current)
      return false;
    const validation = newPasswordSchema.safeParse({
      current: currentRef.current.value,
      password: inputRef.current.value,
      confirm: cfmRef.current.value,
    });
    if (!validation.success) {
      setError(validation.error.flatten().fieldErrors);
      return false;
    }
    setIsLoading(true);
    setError(undefined);
    const res = await updatePassword(
      inputRef.current.value,
      currentRef.current.value,
    );
    setIsLoading(false);
    if (res.status === "error") {
      toast.error(res.message);
      return false;
    }
    toast.success("Password updated successfully!");
    return true;
  };

  return (
    <DrawerDialog
      loading={isLoading}
      header="Change password"
      description="Set a new password."
      mainActionLabel="Save"
      onMainAction={async (close) => {
        const success = await handleUserPasswordChange();
        if (success) close();
      }}
      content={
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              id="current-password"
              ref={currentRef}
              disabled={isLoading}
              right={
                <TogglePasswordButton
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              }
            />
            {error?.current && (
              <span className="mt-2 block text-sm font-medium text-red-500">
                {error.current[0]}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              ref={inputRef}
              disabled={isLoading}
              right={
                <TogglePasswordButton
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              }
            />
            {error?.password && (
              <span className="mt-2 block text-sm font-medium text-red-500">
                {error.password[0]}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              id="confirm-password"
              ref={cfmRef}
              disabled={isLoading}
              right={
                <TogglePasswordButton
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              }
            />
            {error?.confirm && (
              <span className="mt-2 block text-sm font-medium text-red-500">
                {error.confirm[0]}
              </span>
            )}
          </div>
        </div>
      }
    >
      {children}
    </DrawerDialog>
  );
}
