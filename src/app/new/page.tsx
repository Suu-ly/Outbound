import Footer from "@/components/footer";
import Header from "@/components/header";
import UserAvatar from "@/components/user-avatar";
import { Metadata } from "next";
import NewTrip from "./new-trip";

export const metadata: Metadata = {
  title: "Start a New Trip",
  description: "Get started on a new adventure.",
};

export default async function NewTripPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header>
        <UserAvatar />
      </Header>
      <main className="mx-auto flex w-full max-w-screen-sm grow flex-col items-center gap-12 px-4 pt-20">
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
