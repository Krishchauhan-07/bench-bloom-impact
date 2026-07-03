import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform group-hover:rotate-12">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold tracking-tight">
              PlasticBench
            </span>
            <span className="mt-0.5 hidden text-[11px] leading-snug text-muted-foreground sm:block">
              25-27, Shiv Park, Rajiv Nagar, Near Gau Seva Taluka Kanya Shala,
              <br className="hidden lg:inline" /> Airport Road, Jamnagar, Gujarat.
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/journey"
            className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-4"
            activeProps={{ className: "rounded-full px-3 py-2 sm:px-4 bg-secondary text-foreground" }}
          >
            Our Journey
          </Link>
          <Link
            to="/donate"
            className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.02] sm:px-5"
          >
            Donate
          </Link>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-2 text-[11px] leading-snug text-muted-foreground sm:hidden">
        25-27, Shiv Park, Rajiv Nagar, Near Gau Seva Taluka Kanya Shala, Airport Road, Jamnagar, Gujarat.
      </p>
    </header>
  );
}


export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} PlasticBench — a small NGO with big ambitions.</p>
        <Link to="/auth" className="hover:text-foreground">
          NGO Manager Login
        </Link>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
