import Footer from "@/components/footer";
import SignOutButton from "@/components/sign-out-button";
import Tester from "@/components/tester";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/server/auth";
import {
  IconArrowLeft,
  IconDotsVertical,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { headers } from "next/headers";
import Image from "next/image";

export default async function Home() {
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.log(e);
    });
  return (
    <>
      <main className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50">
        <div className="flex items-baseline gap-2">
          <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
          <h1 className="font-display text-4xl font-semibold text-brand-900">
            Outbound
          </h1>
        </div>
        <p>Testing page</p>
        <Separator />
        {session ? (
          <h2 className="text-2xl font-semibold">Hello, {session.user.name}</h2>
        ) : (
          "Not signed in"
        )}
        <SignOutButton />
        <Separator />
        <div className="grid h-full max-w-6xl grid-cols-6 items-center justify-items-start gap-4">
          <Button>Hello default</Button>
          <Button size={"large"}>Hello</Button>
          <Button size="large" iconOnly>
            <IconArrowLeft />
          </Button>
          <Button size={"small"}>
            <IconArrowLeft />
            Hello
          </Button>
          <Button>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"}>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"} variant={"outline"}>
            <IconArrowLeft size={20} />
            Size 20 Manual
          </Button>
          <Button size={"large"} variant={"outline"}>
            <IconArrowLeft />
            Size 20 CSS
          </Button>
          <Button variant={"secondary"} iconOnly>
            <IconArrowLeft />
          </Button>
          <Button variant={"secondary"} size="large" iconOnly>
            <IconArrowLeft />
          </Button>
          <Button size={"large"} variant={"outline"} disabled>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"} disabled>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"} variant={"secondary"} disabled>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"} variant={"secondary"}>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"} variant={"ghost"} disabled>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"large"} variant={"ghost"}>
            <IconArrowLeft />
            Hello
          </Button>
          <Button size={"small"} variant={"ghost"} iconOnly>
            <IconDotsVertical />
          </Button>
          <Input />
          <Input left={<IconSearch />} placeholder="Search..." />
          <Input right={<IconSearch />} disabled placeholder="Search..." />
          <Input
            left={<IconSearch />}
            right={
              <Button size="small" iconOnly variant="ghost">
                <IconX />
              </Button>
            }
          />
          <Tester />
        </div>
      </main>
      <Footer />
    </>
  );
}
