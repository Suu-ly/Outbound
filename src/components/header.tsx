import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  children: React.ReactNode;
};

export default function Header({ children }: HeaderProps) {
  return (
    <header className="sticky inset-x-0 top-0 flex items-center justify-between bg-white px-4 py-3">
      <Link
        href="/"
        className="rounded-full p-1.5 ring-offset-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        <Image src="/outbound.svg" width={20} height={20} alt="outbound" />
      </Link>
      <div className="space-x-1">{children}</div>
    </header>
  );
}
