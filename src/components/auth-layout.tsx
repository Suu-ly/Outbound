import Image from "next/image";
import Link from "next/link";

type AuthLayoutProps = {
  header: string;
  subtitle?: string;
  children: React.ReactNode;
};

const AuthLayout = ({ header, subtitle, children }: AuthLayoutProps) => {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-12 bg-gray-50 p-4">
      <Link href="/" className="flex items-baseline gap-2">
        <Image src="/outbound.svg" width={24} height={24} alt="outbound" />
        <h1 className="font-display text-4xl font-semibold text-brand-900">
          Outbound
        </h1>
      </Link>
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h1
          className={`${!!subtitle ? "mb-3" : "mb-6"} font-display text-2xl font-semibold sm:text-3xl`}
        >
          {header}
        </h1>
        {!!subtitle && <p className="mb-6">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
};

export default AuthLayout;
