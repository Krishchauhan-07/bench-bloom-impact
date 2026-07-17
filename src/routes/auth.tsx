import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Login or Sign up — PlasticBench" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!fullName.trim()) throw new Error("Please enter your full name");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
            data: { full_name: fullName.trim(), phone: phone.trim() },
          },
        });
        if (error) throw error;

        // Insert profile row (requires an active session — auto-confirm or existing session)
        const userId = data.user?.id;
        if (userId && data.session) {
          await supabase.from("profiles").upsert(
            {
              user_id: userId,
              full_name: fullName.trim(),
              email,
              phone: phone.trim() || null,
            },
            { onConflict: "user_id" },
          );
        }
        toast.success("Account created — welcome!");
        navigate({ to: "/profile" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/profile" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 sm:px-6">
        <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elegant">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-4xl">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to track donations and manage your profile."
            : "Join PlasticBench — takes less than a minute."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 w-full space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
        >
          {mode === "signup" && (
            <>
              <div>
                <Label className="mb-1.5 block text-sm">Full name</Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aditi Rao"
                />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Phone (optional)</Label>
                <Input
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                />
              </div>
            </>
          )}
          <div>
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Password</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full" size="lg">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin"
              ? "New here? Create an account →"
              : "Already have an account? Sign in →"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
