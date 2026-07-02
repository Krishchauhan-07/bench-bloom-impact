import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, RefreshCw, Save, ShieldCheck } from "lucide-react";

import { PageShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — PlasticBench" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setIsAdmin(false);
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
    })();
  }, []);

  const { data: impact, refetch: refetchImpact } = useQuery({
    queryKey: ["admin-impact"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("impact_stats")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: donations } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin === true,
  });

  const [form, setForm] = useState({
    total_benches: 0,
    total_plastic_kg: 0,
    kids_helped: 0,
    total_donors: 0,
    co2_saved_kg: 0,
    goal_amount: 0,
    raised_amount: 0,
  });

  useEffect(() => {
    if (impact) {
      setForm({
        total_benches: impact.total_benches,
        total_plastic_kg: impact.total_plastic_kg,
        kids_helped: impact.kids_helped,
        total_donors: impact.total_donors,
        co2_saved_kg: impact.co2_saved_kg,
        goal_amount: impact.goal_amount,
        raised_amount: impact.raised_amount,
      });
    }
  }, [impact]);

  const save = useMutation({
    mutationFn: async () => {
      if (!impact) throw new Error("no impact row");
      const { error } = await supabase
        .from("impact_stats")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", impact.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Impact stats updated");
      qc.invalidateQueries({ queryKey: ["impact"] });
      refetchImpact();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (isAdmin === false) {
    return (
      <PageShell>
        <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
          <h1 className="text-3xl">Not authorised</h1>
          <p className="mt-2 text-muted-foreground">
            Your account isn't an admin. Only the first registered user becomes the admin.
          </p>
          <Button onClick={signOut} variant="outline" className="mt-6 rounded-full">
            Sign out
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </span>
            <h1 className="mt-2 text-4xl">NGO Manager</h1>
            <p className="text-muted-foreground">Edit journey numbers and review donations.</p>
          </div>
          <Button onClick={signOut} variant="outline" className="rounded-full">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>

        {/* Impact stats editor */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Impact stats</h2>
            <Button variant="ghost" size="sm" onClick={() => refetchImpact()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["total_benches", "Benches installed"],
                ["total_plastic_kg", "Plastic diverted (kg)"],
                ["kids_helped", "Kids benefiting"],
                ["total_donors", "Total donors"],
                ["co2_saved_kg", "CO₂ avoided (kg)"],
                ["goal_amount", "Quarter goal (₹)"],
                ["raised_amount", "Raised so far (₹)"],
              ] as const
            ).map(([k, label]) => (
              <div key={k}>
                <Label className="mb-1.5 block text-sm">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: parseInt(e.target.value || "0", 10) })}
                />
              </div>
            ))}
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="mt-6 rounded-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </section>

        {/* Donations table */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl">Recent donations</h2>
          <p className="text-sm text-muted-foreground">
            {donations?.length ?? 0} donation{(donations?.length ?? 0) === 1 ? "" : "s"} on record.
          </p>
          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Benches</TableHead>
                  <TableHead>Engraved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(donations ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-sm">
                      <div>{d.email}</div>
                      <div className="text-muted-foreground">{d.mobile}</div>
                    </TableCell>
                    <TableCell>
                      {d.city}, {d.nation}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{d.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{d.bench_count}</TableCell>
                    <TableCell className="text-sm">
                      {d.print_name ? d.printed_name : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {(donations ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No donations yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
