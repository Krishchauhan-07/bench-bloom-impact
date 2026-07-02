import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, HandHeart, Sparkles, TreePine, Users } from "lucide-react";
import heroBench from "@/assets/hero-bench.jpg";
import { PageShell } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/")({
  component: Landing,
});

function useImpact() {
  return useQuery({
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
}

function Landing() {
  const { data: impact } = useImpact();

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-warm" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-24 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
              <Sparkles className="h-3 w-3" /> Plastic → Public Benches
            </span>
            <h1 className="text-balance text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Turn waste into a{" "}
              <span className="italic text-primary">place to sit.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              We collect discarded plastic and shape it into benches for schools,
              parks and villages. Every ₹500 funds one bench and diverts roughly
              12&nbsp;kg of plastic from landfills.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/donate"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.03]"
              >
                <HandHeart className="h-5 w-5" />
                Donate a bench
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/journey"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-6 py-3 font-semibold hover:bg-card"
              >
                See our journey
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-6">
              <Stat n={impact?.total_benches ?? "—"} label="benches built" />
              <Stat n={impact?.total_plastic_kg ?? "—"} label="kg diverted" suffix="kg" />
              <Stat n={impact?.total_donors ?? "—"} label="donors" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-leaf opacity-40 blur-3xl" />
            <img
              src={heroBench}
              alt="A colorful bench made from recycled plastic in a sunny park"
              width={1600}
              height={1200}
              className="h-full w-full rounded-3xl object-cover shadow-elegant"
            />
          </motion.div>
        </div>
      </section>

      {/* Two big cards — Dashboard */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-10 text-center">
          <h2 className="text-4xl sm:text-5xl">Choose how you want to help.</h2>
          <p className="mt-3 text-muted-foreground">Two doors. Same forest.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <BigCard
            to="/donate"
            title="Donate"
            body="Fund one bench in five minutes. We'll email a receipt and — if you'd like — engrave your name on the bench."
            icon={<HandHeart className="h-6 w-6" />}
            accent="bg-primary text-primary-foreground"
            cta="Start donating"
          />
          <BigCard
            to="/journey"
            title="Our Journey"
            body="Every kilo, every kid, every bench. Live numbers, gallery, and month-by-month growth. Nothing hidden."
            icon={<TreePine className="h-6 w-6" />}
            accent="bg-accent text-accent-foreground"
            cta="Explore the impact"
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/60 bg-secondary/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6">
          <TrustCell
            icon={<TreePine className="h-5 w-5" />}
            title="Real diversion"
            body="Weighed at collection and again at the factory. Numbers you can audit."
          />
          <TrustCell
            icon={<Users className="h-5 w-5" />}
            title="Kids first"
            body="Benches go to rural schools and community spaces, not private clients."
          />
          <TrustCell
            icon={<Sparkles className="h-5 w-5" />}
            title="Zero middlemen"
            body="Donations fund materials and local labour. No paid ads, no commissions."
          />
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ n, label, suffix }: { n: number | string; label: string; suffix?: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold text-primary">
        {n}
        {suffix && typeof n === "number" ? <span className="text-lg">{suffix}</span> : null}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function BigCard({
  to,
  title,
  body,
  icon,
  accent,
  cta,
}: {
  to: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
  cta: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant sm:p-10"
    >
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl transition-opacity group-hover:opacity-70" />
      <div className="relative">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accent}`}>
          {icon}
        </span>
        <h3 className="mt-6 text-3xl sm:text-4xl">{title}</h3>
        <p className="mt-3 max-w-md text-muted-foreground">{body}</p>
      </div>
      <div className="relative mt-8 inline-flex items-center gap-2 font-medium text-primary">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function TrustCell({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div>
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h4 className="text-lg font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
