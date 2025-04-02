"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DrawerDialog from "@/components/ui/drawer-dialog";
import { Input } from "@/components/ui/input";
import Spinner from "@/components/ui/spinner";
import { updateAvatar } from "@/server/actions";
import { IconEdit, IconPhoto } from "@tabler/icons-react";
import { User } from "better-auth";
import { KeyboardEvent, useState } from "react";
import { toast } from "sonner";

const AVATAR_SIZE = 128;

export default function AvatarEdit({ user }: { user: User }) {
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
    if (!avatarContent) return;
    setIsSaving(true);
    const res = await updateAvatar(avatarContent);
    setIsSaving(false);
    if (res.status === "error") toast.error(res.message);
    else toast.success("Avatar updated successfully!");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLLabelElement>) => {
    if (e.code === "Space" || e.code === "Enter") e.currentTarget.click();
  };

  return (
    <div className="group relative isolate overflow-hidden rounded-full border-2 border-slate-200 ring-slate-400 transition-shadow has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-offset-2">
      <DrawerDialog
        header="Edit Avatar"
        description="Change your publicly visible avatar."
        loading={isSaving}
        mainActionLabel="Save"
        onMainAction={async (close) => {
          await handleImageSave();
          close();
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
        <button
          aria-label="Edit user avatar"
          className="absolute z-10 flex size-full items-center justify-center bg-slate-950/70 text-slate-50 opacity-0 ring-offset-zinc-50 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
        >
          <IconEdit className="size-5" />
        </button>
      </DrawerDialog>
      <Avatar className="size-16">
        <AvatarImage src={user.image ?? undefined} />
        <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    </div>
  );
}
