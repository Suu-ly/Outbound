"use client";

import TogglePasswordButton from "@/components/toggle-password-button";
import DrawerDialog from "@/components/ui/drawer-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import {
  serverNavigate,
  updateAvatar,
  updatePassword,
  updateUserName,
} from "@/server/actions";
import { IconEdit, IconPhoto } from "@tabler/icons-react";
import { User } from "better-auth";
import pica from "pica";
import {
  KeyboardEvent,
  ReactNode,
  useRef,
  useState,
  useTransition,
} from "react";
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
  const [isSaving, startSaving] = useTransition();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      // Load image
      const img = new Image();
      img.onload = async () => {
        const height = img.height;
        const width = img.width;
        const side = Math.min(width, height);
        const canvas = document.createElement("canvas");
        canvas.height = side;
        canvas.width = side;
        const output = document.createElement("canvas");
        output.height = AVATAR_SIZE;
        output.width = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Crop image into a square
        ctx.drawImage(img, (side - width) / 2, (side - height) / 2);
        try {
          // Firefox fingerprinting issue prevents this from working
          await pica().resize(canvas, output, {
            filter: "mks2013",
          });
        } catch {
          await pica({
            features: ["all"],
          }).resize(canvas, output, {
            filter: "lanczos3",
          });
        }
        setIsLoading(false);
        setAvatarContent(output.toDataURL("image/jpeg"));
        canvas.remove();
        output.remove();
      };
      img.src = reader.result as string;
    };
  };

  const handleImageSave = async (close: () => void) => {
    startSaving(async () => {
      if (!avatarContent) return;
      const res = await updateAvatar(avatarContent);
      if (res.status === "error") {
        toast.error(res.message);
        return;
      }
      toast.success("Avatar updated successfully!");
      close();
    });
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
      onMainAction={handleImageSave}
      content={
        <div className="flex justify-center">
          {user.image ? (
            <div className="group relative isolate overflow-hidden rounded-full border-2 border-slate-200 ring-slate-400 transition-shadow has-[label:focus-visible]:ring-2 has-[label:focus-visible]:ring-offset-2">
              {isLoading && (
                <div
                  className="absolute z-10 flex size-full items-center justify-center bg-slate-950/70 text-slate-50 backdrop-blur-sm delay-300 duration-300 animate-in fade-in-0 fill-mode-both"
                  role="presentation"
                >
                  <Spinner className="size-6" />
                </div>
              )}
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
  const [isLoading, startLoading] = useTransition();
  const [error, setError] = useState("");

  const handleUserNameChange = async (close: () => void) => {
    startLoading(async () => {
      if (
        !inputRef.current ||
        inputRef.current.value.trim().length < 2 ||
        error
      )
        return;
      if (inputRef.current.value.trim() === currentName) return;
      const res = await updateUserName(inputRef.current.value.trim());
      if (res.status === "error") {
        toast.error(res.message);
        return;
      }
      toast.success("Name updated successfully!");
      close();
    });
  };

  return (
    <DrawerDialog
      loading={isLoading}
      header="Edit name"
      description="Change your publicly visible name."
      mainActionLabel="Save"
      onMainAction={handleUserNameChange}
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

export function DeleteUserDialog({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleDeleteUser = async () => {
    if (!inputRef.current || !inputRef.current.value) {
      setError("Please confirm you wish to delete your account!");
      return;
    }
    if (inputRef.current.value !== "delete") {
      setError("Please type 'delete' to confirm deletion!");
      return;
    }
    setIsLoading(true);
    const { error } = await authClient.deleteUser({
      fetchOptions: {
        onSuccess: () => {
          serverNavigate("/");
        },
      },
    });
    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <DrawerDialog
      loading={isLoading}
      header="Delete account?"
      description={
        "You will delete all your data and trips. You cannot undo this action.\n\nTo confirm, please type 'delete' below."
      }
      mainActionLabel="Delete"
      onMainAction={handleDeleteUser}
      destructive
      content={
        <>
          <Input
            type={"text"}
            ref={inputRef}
            disabled={isLoading}
            placeholder={"Confirm deletion"}
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
  const [isLoading, startLoading] = useTransition();
  const [error, setError] = useState<{
    current?: string[];
    password?: string[];
    confirm?: string[];
  }>();

  const handleUserPasswordChange = async (close: () => void) => {
    startLoading(async () => {
      if (!inputRef.current || !cfmRef.current || !currentRef.current) return;
      const validation = newPasswordSchema.safeParse({
        current: currentRef.current.value,
        password: inputRef.current.value,
        confirm: cfmRef.current.value,
      });
      if (!validation.success) {
        setError(validation.error.flatten().fieldErrors);
        return;
      }
      setError(undefined);
      const res = await updatePassword(
        inputRef.current.value,
        currentRef.current.value,
      );
      if (res.status === "error") {
        toast.error(res.message);
        return;
      }
      toast.success("Password updated successfully!");
      close();
    });
  };

  return (
    <DrawerDialog
      loading={isLoading}
      header="Change password"
      description="Set a new password."
      mainActionLabel="Save"
      onMainAction={handleUserPasswordChange}
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
