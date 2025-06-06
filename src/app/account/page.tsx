import Footer from "@/components/footer";
import Header from "@/components/header";
import SignOutButton from "@/components/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import { IconChevronRight, IconEdit } from "@tabler/icons-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AvatarEdit,
  DeleteUserDialog,
  EditNameDialog,
  EditPasswordDialog,
} from "./account-controls";

export const metadata: Metadata = {
  title: "Account",
  description: "View and change your account details.",
};

export default async function AccountPage() {
  const userHeaders = await headers();
  const [session, accounts] = await Promise.all([
    auth.api
      .getSession({
        headers: userHeaders,
        query: {
          disableRefresh: true,
        },
      })
      .catch((e) => {
        console.error(e);
      }),
    auth.api
      .listUserAccounts({
        headers: userHeaders,
      })
      .catch((e) => {
        console.error(e);
      }),
  ]);

  if (!session || !accounts) {
    const path = new URLSearchParams([["redirect", "/account"]]);
    redirect(`/login?${path.toString()}`);
  }

  // Checks if user has an email based account with password
  const hasPassword = accounts.some((val) => val.provider === "credential");

  return (
    <div className="flex min-h-dvh flex-col">
      <Header>
        <Link
          href="/account"
          className="rounded-full ring-slate-400 ring-offset-white transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Avatar>
            <AvatarImage src={session.user.image ?? undefined} />
            <AvatarFallback>
              {session.user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </Header>
      <main className="flex grow flex-col items-center gap-6 px-4 py-8">
        <div className="flex max-w-full flex-col items-center gap-2">
          <div className="group relative isolate overflow-hidden rounded-full border-2 border-slate-200 ring-slate-400 transition-shadow has-[button:focus-visible]:ring-2 has-[button:focus-visible]:ring-offset-2">
            <AvatarEdit user={session.user} key={session.user.image}>
              <button
                aria-label="Edit user avatar"
                className="absolute z-10 flex size-full items-center justify-center bg-slate-950/70 text-slate-50 opacity-0 ring-offset-gray-50 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
              >
                <IconEdit className="size-5" />
              </button>
            </AvatarEdit>
            <Avatar className="size-16">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback>
                {session.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <h1 className="line-clamp-2 w-full max-w-lg break-words font-display text-4xl font-semibold">
            {session.user.name}
          </h1>
        </div>
        <SignOutButton />
        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 xl:grid-cols-[128px_minmax(0,1fr)]">
          <h3 className="text-sm font-medium text-slate-900">
            Account Details
          </h3>
          <div className="space-y-2 text-slate-700">
            <EditNameDialog currentName={session.user.name}>
              <button className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left ring-offset-gray-50 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
                <p className="w-20 shrink-0 text-sm font-medium text-slate-900">
                  Name
                </p>
                <span className="grow truncate">{session.user.name}</span>
                <IconChevronRight className="size-5 shrink-0" />
              </button>
            </EditNameDialog>
            <div className="flex w-full gap-3 rounded-xl bg-white p-4">
              <p className="w-20 shrink-0 text-sm font-medium text-slate-900">
                Email
              </p>
              <span className="grow truncate">{session.user.email}</span>
            </div>
            {hasPassword && (
              <EditPasswordDialog>
                <button className="flex w-full items-center gap-3 rounded-xl bg-white p-4 text-left ring-offset-gray-50 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
                  <p className="w-20 shrink-0 text-sm font-medium text-slate-900">
                    Password
                  </p>
                  <span className="grow truncate">●●●●●●●●●●</span>
                  <IconChevronRight className="size-5 shrink-0" />
                </button>
              </EditPasswordDialog>
            )}
          </div>
        </div>
        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 xl:grid-cols-[128px_minmax(0,1fr)]">
          <h3 className="text-sm font-medium text-slate-900">Delete Account</h3>
          <div className="flex flex-col items-end gap-6 rounded-xl border-2 border-rose-200 p-4">
            <p className="text-sm text-slate-700">
              Deleting your account will permanently delete all of your data and
              trips. You cannot undo this action. Please proceed with caution.
            </p>
            <DeleteUserDialog hasPassword={hasPassword}>
              <Button
                variant="secondary"
                className="bg-red-200 text-rose-700 hover:bg-rose-200/90 hover:text-rose-800 active:ring-rose-300"
              >
                Delete
              </Button>
            </DeleteUserDialog>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
