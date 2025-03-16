import Footer from "@/components/footer";
import Header from "@/components/header";
import SignOutButton from "@/components/sign-out-button";
import Tester from "@/components/tester";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ButtonLink from "@/components/ui/button-link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft,
  IconDotsVertical,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header>
        <Avatar>
          <AvatarFallback>NA</AvatarFallback>
        </Avatar>
      </Header>
      <main className="flex w-full grow flex-col items-center justify-center gap-4 bg-zinc-50 py-8">
        <div className="flex items-baseline gap-2">
          <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
          <h1 className="font-display text-4xl font-semibold text-brand-900">
            Outbound
          </h1>
        </div>
        <p>Testing page</p>
        <Separator />
        <SignOutButton />
        <Separator />
        <div className="grid h-full max-w-6xl grid-cols-2 items-center justify-items-start gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size={"large"}>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Example dialog</DialogTitle>
              This is the dialog body. It is used to explain some stuff to the
              user that needs their attention.
              <DialogFooter>
                <DialogClose asChild>
                  <Button>Accept</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="ghost">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" size="small">
                Open Drawer
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="space-y-6">
                <DrawerTitle>Example Drawer</DrawerTitle>
                <p>
                  This is the drawer body. It is used to explain some stuff to
                  the user that needs their attention.
                </p>
                <DrawerFooter>
                  <DrawerClose asChild>
                    <Button>Accept</Button>
                  </DrawerClose>
                  <DrawerClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
          <Button size={"small"}>
            <IconArrowLeft />
            Small
          </Button>
          <Button>
            <IconArrowLeft />
            Default
          </Button>
          <Button size={"large"}>
            <IconArrowLeft />
            Large
          </Button>
          <Button size={"large"} variant={"outline"}>
            <IconArrowLeft size={20} />
            Size 20 Manual
          </Button>
          <Button size={"large"} variant={"outline"}>
            <IconArrowLeft />
            Size 20 CSS
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
        <Separator />
        <div className="grid h-full max-w-6xl grid-cols-2 items-center justify-items-start gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <ButtonLink href="/login">Login</ButtonLink>
          <ButtonLink href="/new" size="large">
            New Trip
          </ButtonLink>
        </div>
      </main>
      <Footer />
    </div>
  );
}
