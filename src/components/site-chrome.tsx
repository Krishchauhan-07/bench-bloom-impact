import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import type { ReactNode } from "react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-12">
            <Leaf className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            PlasticBench
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/journey"
            className="rounded-full px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "rounded-full px-4 py-2 bg-secondary text-foreground" }}
          >
            Our Journey
          </Link>
          <Link
            to="/donate"
            className="rounded-full bg-primary px-5 py-2 font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            Donate
          </Link>
        </nav>
      </div>
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
