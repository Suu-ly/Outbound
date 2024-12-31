import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconArrowLeft, IconDotsVertical } from "@tabler/icons-react";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full gap-4 bg-zinc-50">
      <div className="flex gap-2 items-baseline">
        <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
        <h1 className="font-display text-4xl  font-semibold text-brand-900">
          Outbound
        </h1>
      </div>
      <p>Testing page</p>
      <Separator />
      <div className="grid grid-cols-6 max-w-6xl h-full gap-4 justify-items-start items-center">
        <Button>Hello</Button>
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
      </div>
    </main>
  );
}
