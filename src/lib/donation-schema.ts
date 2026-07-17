import { z } from "zod";

// Impact conversion constants — update to real values later.
export const KG_PER_RUPEE = 0.2; // ₹5 → 1 kg recycled
export const COST_PER_BENCH = 500; // ₹500 → 1 bench

export const BENCH_PRICE = COST_PER_BENCH;

export const donorSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  address: z.string().trim().min(3, "Please enter your address").max(300),
  city: z.string().trim().min(2, "Please enter your city").max(100),
  nation: z.string().trim().min(2, "Please enter your country").max(100),
});

export type DonorDetails = z.infer<typeof donorSchema>;

export const benchPresets = [
  { count: 1, amount: 500, label: "1 Bench", desc: "Seat two kids after school" },
  { count: 2, amount: 1000, label: "2 Benches", desc: "Furnish a small classroom" },
  { count: 5, amount: 2500, label: "5 Benches", desc: "Outfit a village square" },
] as const;
