import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Download,
  Info,
  Landmark,
  Loader2,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  benchPresets,
  BENCH_PRICE,
  donorSchema,
  type DonorDetails,
} from "@/lib/donation-schema";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate a Bench — PlasticBench" },
      { name: "description", content: "Fund a bench built from recycled plastic in five minutes." },
    ],
  }),
  component: DonatePage,
});

type Step = 0 | 1 | 2 | 3 | 4;

function DonatePage() {
  const [step, setStep] = useState<Step>(0);
  const [donor, setDonor] = useState<DonorDetails | null>(null);
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [printName, setPrintName] = useState(true);
  const [printedName, setPrintedName] = useState("");
  const [donationId, setDonationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const benchCount = Math.max(1, Math.floor(amount / BENCH_PRICE));

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
        <Stepper step={step} />
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <StepWrap key="s0">
                <StepDonor
                  initial={donor}
                  onNext={(d) => {
                    setDonor(d);
                    if (!printedName) setPrintedName(d.name);
                    setStep(1);
                  }}
                />
              </StepWrap>
            )}
            {step === 1 && (
              <StepWrap key="s1">
                <StepAmount
                  amount={amount}
                  customAmount={customAmount}
                  onAmount={setAmount}
                  onCustom={setCustomAmount}
                  onBack={() => setStep(0)}
                  onNext={() => setStep(2)}
                />
              </StepWrap>
            )}
            {step === 2 && (
              <StepWrap key="s2">
                <StepEngrave
                  printName={printName}
                  printedName={printedName}
                  defaultName={donor?.name ?? ""}
                  benchCount={benchCount}
                  onPrintName={setPrintName}
                  onPrintedName={setPrintedName}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                />
              </StepWrap>
            )}
            {step === 3 && (
              <StepWrap key="s3">
                <StepPayment
                  amount={amount}
                  isProcessing={isProcessing}
                  onBack={() => setStep(2)}
                  onPay={async () => {
                    if (!donor) return;
                    setIsProcessing(true);
                    // Demo gateway: simulate processing, never gate success on network
                    await new Promise((r) => setTimeout(r, 1400));
                    const fallbackId = `DON-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
                    try {
                      const { data, error } = await supabase
                        .from("donations")
                        .insert({
                          name: donor.name,
                          mobile: donor.mobile,
                          email: donor.email,
                          address: donor.address,
                          city: donor.city,
                          nation: donor.nation,
                          amount,
                          bench_count: benchCount,
                          print_name: printName,
                          printed_name: printName ? printedName.trim() || donor.name : null,
                        })
                        .select("donation_id")
                        .single();
                      setDonationId(!error && data ? data.donation_id : fallbackId);
                    } catch {
                      setDonationId(fallbackId);
                    }
                    setIsProcessing(false);
                    setStep(4);
                  }}
                />
              </StepWrap>
            )}

          </AnimatePresence>
        </div>
      </div>
    </PageShell>
  );
}

function StepWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Details", "Amount", "Engraving", "Payment", "Done"];
  return (
    <ol className="flex items-center justify-between gap-2">
      {labels.map((label, i) => {
        const active = i <= step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                active ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span className={`h-px flex-1 ${active ? "bg-primary/50" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepDonor({
  initial,
  onNext,
}: {
  initial: DonorDetails | null;
  onNext: (d: DonorDetails) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DonorDetails>({
    resolver: zodResolver(donorSchema),
    defaultValues: initial ?? { nation: "India" },
  });

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onNext)}>
      <StepHeader
        eyebrow="Step 1 of 4"
        title="Tell us a little about you"
        subtitle="We'll send a receipt and (only if you say so) engrave your name on the bench."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.name?.message}>
          <Input placeholder="Aditi Rao" {...register("name")} />
        </Field>
        <Field label="Mobile (10 digits)" error={errors.mobile?.message}>
          <Input inputMode="numeric" placeholder="9876543210" {...register("mobile")} />
        </Field>
        <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
          <Input type="email" placeholder="aditi@example.com" {...register("email")} />
        </Field>
        <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
          <Textarea rows={2} placeholder="Flat / Street" {...register("address")} />
        </Field>
        <Field label="City" error={errors.city?.message}>
          <Input placeholder="Mumbai" {...register("city")} />
        </Field>
        <Field label="Country" error={errors.nation?.message}>
          <Input placeholder="India" {...register("nation")} />
        </Field>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" size="lg" className="rounded-full">
          Continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function StepAmount({
  amount,
  customAmount,
  onAmount,
  onCustom,
  onBack,
  onNext,
}: {
  amount: number;
  customAmount: string;
  onAmount: (n: number) => void;
  onCustom: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const benchCount = Math.max(1, Math.floor(amount / BENCH_PRICE));
  const kg = benchCount * 12;

  return (
    <div>
      <StepHeader
        eyebrow="Step 2 of 4"
        title="How many benches?"
        subtitle={`Each bench is ₹${BENCH_PRICE} and diverts ~12 kg of plastic.`}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {benchPresets.map((p) => {
          const selected = amount === p.amount && customAmount === "";
          return (
            <button
              key={p.count}
              onClick={() => {
                onAmount(p.amount);
                onCustom("");
              }}
              className={`rounded-2xl border p-5 text-left transition-all ${
                selected
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="text-sm font-semibold text-primary">{p.label}</div>
              <div className="mt-1 font-display text-2xl">₹{p.amount}</div>
              <div className="mt-1 text-xs text-muted-foreground">{p.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-border p-5">
        <Label className="text-sm font-medium">Or enter a custom amount (₹)</Label>
        <div className="mt-2 flex items-center gap-3">
          <Input
            inputMode="numeric"
            value={customAmount}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              onCustom(raw);
              const n = parseInt(raw || "0", 10);
              if (n > 0) onAmount(n);
              else onAmount(500);
            }}
            placeholder="e.g. 3000"
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground">
            = <span className="font-semibold text-foreground">{benchCount}</span>{" "}
            bench{benchCount === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-accent/15 p-4 text-sm">
        <Sparkles className="h-4 w-4 text-accent-foreground" />
        <p>
          You'll fund <strong>{benchCount}</strong> bench{benchCount === 1 ? "" : "es"} and divert{" "}
          <strong>{kg} kg</strong> of plastic from landfills.
        </p>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-full">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button size="lg" onClick={onNext} className="rounded-full">
          Continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepEngrave({
  printName,
  printedName,
  defaultName,
  benchCount,
  onPrintName,
  onPrintedName,
  onBack,
  onNext,
}: {
  printName: boolean;
  printedName: string;
  defaultName: string;
  benchCount: number;
  onPrintName: (b: boolean) => void;
  onPrintedName: (s: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    if (printName && !printedName) onPrintedName(defaultName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printName]);

  return (
    <div>
      <StepHeader
        eyebrow="Step 3 of 4"
        title="Would you like your name on the bench?"
        subtitle="Some donors gift benches in memory of a loved one — the name can be different from yours."
      />

      <div className="flex items-start gap-4 rounded-2xl border border-border bg-secondary/40 p-5">
        <Switch checked={printName} onCheckedChange={onPrintName} id="engrave" />
        <div className="flex-1">
          <Label htmlFor="engrave" className="text-base font-semibold">
            Engrave a name on {benchCount === 1 ? "the bench" : "each bench"}
          </Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Appears on the donor wall too — with the donor's consent.
          </p>
        </div>
      </div>

      {printName && (
        <div className="mt-6">
          <Label className="mb-1.5 block text-sm font-medium">Name to engrave</Label>
          <Input
            value={printedName}
            onChange={(e) => onPrintedName(e.target.value)}
            maxLength={80}
            placeholder={defaultName}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Preview: <span className="font-semibold text-foreground">“{printedName || defaultName || "—"}”</span>
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-full">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={printName && !printedName.trim() && !defaultName.trim()}
          className="rounded-full"
        >
          Continue to payment <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function StepPayment({
  amount,
  isProcessing,
  onBack,
  onPay,
}: {
  amount: number;
  isProcessing: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  const [tab, setTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [upi, setUpi] = useState("demo@upi");
  const [cardNo, setCardNo] = useState("4111 1111 1111 1111");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [bank, setBank] = useState("Demo Bank");

  function handlePay() {
    if (tab === "upi" && !upi.trim()) {
      toast.error("Please enter a UPI ID.");
      return;
    }
    if (tab === "card") {
      if (!cardNo.trim() || !cardName.trim() || !cardExp.trim() || !cardCvv.trim()) {
        toast.error("Please fill all card details.");
        return;
      }
    }
    if (tab === "netbanking" && !bank.trim()) {
      toast.error("Please select a bank.");
      return;
    }
    onPay();
  }

  return (
    <div className="relative">
      <span className="absolute -top-2 right-0 rounded-full bg-honey/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-clay">
        Demo payment gateway
      </span>
      <StepHeader
        eyebrow="Step 4 of 4"
        title="Complete your donation"
        subtitle="No real transaction happens — this is a mock gateway for demo purposes."
      />

      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Amount</div>
            <div className="font-display text-3xl font-semibold">₹{amount.toLocaleString()}</div>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            PlasticBench NGO
          </div>
        </div>

        <div className="flex border-b border-border">
          {(
            [
              { id: "upi", label: "UPI", icon: <Smartphone className="h-4 w-4" /> },
              { id: "card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
              { id: "netbanking", label: "Netbanking", icon: <Landmark className="h-4 w-4" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "upi" && (
            <div className="space-y-3">
              <Label className="text-sm">UPI ID</Label>
              <Input placeholder="yourname@upi" value={upi} onChange={(e) => setUpi(e.target.value)} />
            </div>
          )}
          {tab === "card" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Card number">
                <Input placeholder="4111 1111 1111 1111" value={cardNo} onChange={(e) => setCardNo(e.target.value)} />
              </Field>
              <Field label="Name on card">
                <Input placeholder="Aditi Rao" value={cardName} onChange={(e) => setCardName(e.target.value)} />
              </Field>
              <Field label="Expiry">
                <Input placeholder="MM/YY" value={cardExp} onChange={(e) => setCardExp(e.target.value)} />
              </Field>
              <Field label="CVV">
                <Input placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
              </Field>
            </div>
          )}
          {tab === "netbanking" && (
            <div>
              <Label className="text-sm">Select bank</Label>
              <Input placeholder="HDFC / ICICI / SBI …" value={bank} onChange={(e) => setBank(e.target.value)} className="mt-2" />
            </div>
          )}

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              This page mimics Razorpay for the demo. No card is charged and no payment
              network is contacted.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isProcessing} className="rounded-full">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button
          size="lg"
          onClick={handlePay}
          disabled={isProcessing}
          className="rounded-full min-w-40"

        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            <>Pay ₹{amount.toLocaleString()}</>
          )}
        </Button>
      </div>
    </div>
  );
}

function StepThankYou({
  donor,
  amount,
  benchCount,
  donationId,
  printedName,
}: {
  donor: DonorDetails;
  amount: number;
  benchCount: number;
  donationId: string;
  printedName: string | null;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const end = Date.now() + 800;
    const colors = ["#2F5233", "#8AB17D", "#E9C46A"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const dateStr = useMemo(
    () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    [],
  );

  function printReceipt() {
    window.print();
  }

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-leaf text-primary-foreground shadow-glow"
      >
        <Check className="h-10 w-10" strokeWidth={3} />
      </motion.div>
      <h2 className="text-4xl sm:text-5xl">Thank you, {donor.name.split(" ")[0]}!</h2>
      <p className="mt-3 text-muted-foreground">
        You've funded{" "}
        <strong className="text-foreground">
          {benchCount} bench{benchCount === 1 ? "" : "es"}
        </strong>
        . That's roughly <strong className="text-foreground">{benchCount * 12} kg</strong> of
        plastic diverted from landfills.
      </p>

      <div
        ref={receiptRef}
        className="mx-auto mt-8 max-w-md rounded-2xl border border-dashed border-primary/40 bg-secondary/40 p-6 text-left"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="font-display text-lg font-semibold">Donation Receipt</div>
          <div className="text-xs text-muted-foreground">{dateStr}</div>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Donation ID" value={donationId} />
          <Row label="Donor" value={donor.name} />
          <Row label="Email" value={donor.email} />
          <Row label="City" value={`${donor.city}, ${donor.nation}`} />
          <Row label="Amount" value={`₹${amount.toLocaleString()}`} />
          <Row label="Benches funded" value={String(benchCount)} />
          {printedName && <Row label="Engraved as" value={`“${printedName}”`} />}
        </dl>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Demo receipt — no real payment was processed.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={printReceipt} variant="outline" className="rounded-full">
          <Download className="mr-2 h-4 w-4" /> Save / Print Receipt
        </Button>
        <Button onClick={() => navigate({ to: "/journey" })} className="rounded-full">
          See the impact
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
