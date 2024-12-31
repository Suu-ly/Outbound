import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="w-full bg-slate-100 p-4 pb-8">
      <div className="flex flex-wrap gap-x-16 gap-y-4 items-baseline justify-between mx-auto max-w-7xl">
        <div className="flex gap-2 items-baseline">
          <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
          <h1 className="font-display text-4xl  font-semibold text-brand-900">
            Outbound
          </h1>
        </div>
        <div>
          <span className="text-slate-500">A project by</span> Lance
          <Link
            href="https://github.com/Suu-ly/Outbound"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-700 transition-colors ml-8"
          >
            Github
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
