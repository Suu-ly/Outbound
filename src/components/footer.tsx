import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-slate-100 p-4 pb-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-x-16 gap-y-4">
        <div className="flex items-baseline gap-2">
          <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
          <h1 className="font-display text-4xl font-semibold text-brand-900">
            Outbound
          </h1>
        </div>
        <div>
          <span className="text-slate-500">A project by</span> Lance
          <Link
            href="https://github.com/Suu-ly/Outbound"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-8 rounded-full text-slate-500 ring-slate-400 ring-offset-2 ring-offset-slate-100 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2"
          >
            Github
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
