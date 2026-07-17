import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, UserCircle2 } from "lucide-react";

import { PageShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — PlasticBench" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name ?? "");
        setPhone(profile.phone ?? "");
        if (profile.email) setEmail(profile.email);
      } else {
        // Auto-create if missing (e.g. account was created before profiles existed)
        const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string };
        setFullName(meta.full_name ?? "");
        setPhone(meta.phone ?? "");
        await supabase.from("profiles").upsert(
          {
            user_id: user.id,
            full_name: meta.full_name ?? null,
            phone: meta.phone ?? null,
            email: user.email,
          },
          { onConflict: "user_id" },
        );
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("user_id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl">My Profile</h1>
            <p className="text-sm text-muted-foreground">
              Update your details — visible only to you.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8"
        >
          <div>
            <Label className="mb-1.5 block text-sm">Email</Label>
            <Input value={email} disabled readOnly />
            <p className="mt-1 text-xs text-muted-foreground">
              Contact support to change your login email.
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Aditi Rao"
              disabled={loading}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm">Phone</Label>
            <Input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              disabled={loading}
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="rounded-full"
              disabled={saving || loading}
            >
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
