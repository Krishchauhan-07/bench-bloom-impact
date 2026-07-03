import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Leaf, PackageCheck, School, Users, Wind } from "lucide-react";

import { PageShell } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import benchSide from "@/assets/bench-side.jpg.asset.json";
import benchTop from "@/assets/bench-top.jpg.asset.json";

const benchGallery = [
  { src: benchSide.url, caption: "Bench tile — side profile showing the compressed recycled plastic layers." },
  { src: benchTop.url, caption: "Finished bench top — made from ~12 kg of recycled plastic waste." },
  { src: benchSide.url, caption: "Ready for installation in a school courtyard." },
];


export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Our Journey — PlasticBench Impact" },
      {
        name: "description",
        content:
          "Live impact numbers: benches built, plastic diverted, kids helped and donors so far.",
      },
    ],
  }),
  component: JourneyPage,
});

const growthData = [
  { month: "Jan", benches: 4, plastic: 90 },
  { month: "Feb", benches: 6, plastic: 140 },
  { month: "Mar", benches: 9, plastic: 210 },
  { month: "Apr", benches: 12, plastic: 310 },
  { month: "May", benches: 15, plastic: 390 },
  { month: "Jun", benches: 18, plastic: 460 },
  { month: "Jul", benches: 22, plastic: 560 },
  { month: "Aug", benches: 26, plastic: 680 },
];

const allocationData = [
  { name: "Plastic collection", value: 30, color: "var(--forest)" },
  { name: "Manufacturing", value: 45, color: "var(--leaf)" },
  { name: "Installation", value: 15, color: "var(--honey)" },
  { name: "Operations", value: 10, color: "var(--clay)" },
];

function JourneyPage() {
  const { data: impact, isLoading } = useQuery({
    queryKey: ["impact"],
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

  const { data: donorWall } = useQuery({
    queryKey: ["donor-wall"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donor_wall")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data ?? [];
    },
  });

  const goal = impact?.goal_amount ?? 100000;
  const raised = impact?.raised_amount ?? 0;
  const pct = Math.min(100, Math.round((raised / goal) * 100));

  return (
    <PageShell>
      {/* Hero */}
      <section className="border-b border-border/60 bg-gradient-warm">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl text-balance text-5xl sm:text-6xl lg:text-7xl"
          >
            Our journey, in <span className="italic text-primary">real numbers.</span>
          </motion.h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Every kilogram of plastic, every bench, every child — logged and updated by our
            field team. No inflated marketing numbers.
          </p>
        </div>
      </section>

      {/* Big stats */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BigStat
            icon={<PackageCheck className="h-5 w-5" />}
            value={impact?.total_benches}
            label="Benches installed"
            loading={isLoading}
          />
          <BigStat
            icon={<Leaf className="h-5 w-5" />}
            value={impact?.total_plastic_kg}
            suffix=" kg"
            label="Plastic diverted"
            loading={isLoading}
          />
          <BigStat
            icon={<School className="h-5 w-5" />}
            value={impact?.kids_helped}
            label="Kids benefiting"
            loading={isLoading}
          />
          <BigStat
            icon={<Users className="h-5 w-5" />}
            value={impact?.total_donors}
            label="Donors so far"
            loading={isLoading}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl">Quarter goal</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                ₹{raised.toLocaleString()}
              </span>{" "}
              raised of ₹{goal.toLocaleString()}
            </p>
          </div>
          <Progress value={pct} className="mt-4 h-3" />
          <p className="mt-2 text-xs text-muted-foreground">{pct}% funded — thank you.</p>
        </div>

        {/* CO2 card */}
        <div className="mt-6 flex items-center gap-4 rounded-3xl border border-border bg-gradient-leaf p-6 text-primary-foreground shadow-soft sm:p-8">
          <Wind className="h-10 w-10 shrink-0" />
          <div>
            <div className="text-sm uppercase tracking-widest opacity-80">Environmental impact</div>
            <div className="font-display text-3xl font-semibold sm:text-4xl">
              {(impact?.co2_saved_kg ?? 0).toLocaleString()} kg CO₂e avoided
            </div>
            <p className="text-sm opacity-90">
              Based on NGO-verified conversion of ~1.5 kg CO₂e per kg of recycled plastic.
            </p>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
            <h3 className="text-xl">Month-by-month growth</h3>
            <p className="text-sm text-muted-foreground">
              Benches installed and plastic diverted, per month.
            </p>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="benches" fill="var(--forest)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="plastic" fill="var(--honey)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h3 className="text-xl">Where donations go</h3>
            <p className="text-sm text-muted-foreground">Per every ₹100.</p>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {allocationData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.75rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {allocationData.map((d) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    {d.name}
                  </span>
                  <span className="font-medium">{d.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bench gallery */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h3 className="text-2xl">Our Benches</h3>
          <p className="text-sm text-muted-foreground">
            Real photos from our workshop — every bench is pressed from shredded, cleaned
            post-consumer plastic.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benchGallery.map((b, i) => (
              <figure
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-secondary/30"
              >
                <img
                  src={b.src}
                  alt={b.caption}
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="p-3 text-sm text-muted-foreground">
                  {b.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Donor wall */}

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h3 className="text-2xl">Donor wall</h3>
          <p className="text-sm text-muted-foreground">
            Names engraved on benches, with donor consent.
          </p>
          {donorWall && donorWall.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {donorWall.map((d) => (
                <span
                  key={d.donation_id}
                  className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary"
                >
                  {d.printed_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Be one of the first — donate a bench and choose to engrave your name.
            </p>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function BigStat({
  icon,
  value,
  suffix,
  label,
  loading,
}: {
  icon: React.ReactNode;
  value?: number | null;
  suffix?: string;
  label: string;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-border bg-card p-6 shadow-soft"
    >
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="font-display text-4xl font-semibold">
        {loading ? "…" : (value ?? 0).toLocaleString()}
        {suffix && <span className="text-xl text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}
