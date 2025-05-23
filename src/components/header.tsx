import Image from "next/image";
import Link from "next/link";

type HeaderProps = {
  children: React.ReactNode;
  fixed?: boolean;
};

export default function Header({ children, fixed }: HeaderProps) {
  return (
    <header
      className={`${fixed ? "fixed" : "sticky"} inset-x-0 top-0 z-50 flex items-center justify-between bg-white px-4 py-3`}
    >
      <Link
        href="/"
        className="flex items-baseline gap-1 rounded-full p-1.5 ring-slate-400 ring-offset-2 ring-offset-white transition focus-visible:outline-none focus-visible:ring-2"
      >
        <Image src="/outbound.svg" width={20} height={20} alt="outbound" />
        <h1 className="hidden font-display text-3xl font-semibold leading-5 text-brand-900 sm:inline">
          Outbound
        </h1>
      </Link>
      <div className="flex items-center gap-1">{children}</div>
    </header>
  );
}
