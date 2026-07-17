import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, Phone, UserCircle2 } from "lucide-react";

import cctLogo from "@/assets/cct-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setDisplayName(
          data?.full_name?.trim() ||
            (user.user_metadata?.full_name as string | undefined) ||
            user.email ||
            null,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { user, displayName };
}

export function SiteHeader() {
  const { user, displayName } = useAuthUser();
  const navigate = useNavigate();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-start gap-3">
          <img
            src={cctLogo.url}
            alt="Chaitanya Charitable Trust logo"
            className="h-12 w-12 shrink-0 object-contain transition-transform group-hover:scale-105 sm:h-[50px] sm:w-[50px]"
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-semibold tracking-tight">
              Chaitanya Charitable Trust
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
          {user ? (
            <>
              <Link
                to="/profile"
                className="ml-1 hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
                activeProps={{
                  className:
                    "ml-1 hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/5 px-3 py-2 font-medium text-foreground",
                }}
              >
                <UserCircle2 className="h-4 w-4" />
                <span className="max-w-[10ch] truncate">{displayName ?? "Profile"}</span>
              </Link>
              <Link
                to="/profile"
                className="ml-1 inline-flex items-center rounded-full border border-border bg-card p-2 text-foreground sm:hidden"
                aria-label="Profile"
              >
                <UserCircle2 className="h-5 w-5" />
              </Link>
              <button
                onClick={handleSignOut}
                aria-label="Logout"
                className="ml-1 inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="ml-1 rounded-full border border-border bg-card px-3 py-2 font-medium text-foreground transition-colors hover:bg-secondary sm:px-4"
            >
              Login
            </Link>
          )}
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
        <a
          href="tel:9737380111"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 font-medium text-primary transition-colors hover:bg-primary/10"
        >
          <Phone className="h-4 w-4" />
          Helpline: 9737380111
        </a>
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

// Suppress unused import warning for Button when tree-shaken
export { Button as _KeepButton };
