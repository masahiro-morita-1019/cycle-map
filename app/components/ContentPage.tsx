import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

type ContentPageProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function ContentPage({ title, description, children }: ContentPageProps) {
  return (
    <main className="min-h-dvh bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-sm font-semibold text-white">
            {SITE_NAME}
          </Link>
          <nav className="flex flex-wrap justify-end gap-4 text-sm text-neutral-300">
            <Link className="hover:text-white" href="/about">
              About
            </Link>
            <Link className="hover:text-white" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-white" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
        <p className="text-sm font-semibold text-sky-300">{SITE_NAME}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl leading-8 text-neutral-300">{description}</p>
        <div className="mt-10 space-y-8 text-neutral-300">{children}</div>
      </article>
    </main>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="space-y-3 leading-8">{children}</div>
    </section>
  );
}
