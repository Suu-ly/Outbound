import Footer from "@/components/footer";
import Header from "@/components/header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/server/auth";
import { headers } from "next/headers";
import NewTrip from "./new-trip";

export default async function Home() {
  const session = await auth.api
    .getSession({
      headers: await headers(),
    })
    .catch((e) => {
      console.log(e);
    });
  return (
    <div className="flex min-h-dvh flex-col">
      <Header>
        <Avatar>
          <AvatarImage
            src={session && session.user.image ? session.user.image : undefined}
          />
          <AvatarFallback>{session ? session.user.name : "NA"}</AvatarFallback>
        </Avatar>
      </Header>
      <main className="mx-auto flex w-full max-w-screen-sm grow flex-col items-center gap-12 px-8 pt-20">
        <div className="text-center">
          <h1 className="mb-3 font-display text-4xl font-semibold">New Trip</h1>
          <h3 className="text-lg text-slate-700">
            Get started on your next adventure
          </h3>
        </div>
        <NewTrip />
      </main>
      <Footer />
    </div>
  );
}
