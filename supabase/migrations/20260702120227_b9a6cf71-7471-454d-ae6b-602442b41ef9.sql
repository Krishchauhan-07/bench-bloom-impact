
DROP VIEW public.donor_wall;
CREATE VIEW public.donor_wall WITH (security_invoker=true) AS
  SELECT donation_id, printed_name, bench_count, created_at
  FROM public.donations
  WHERE print_name = true AND printed_name IS NOT NULL AND length(trim(printed_name)) > 0;
GRANT SELECT ON public.donor_wall TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY "anyone can insert donation" ON public.donations;
CREATE POLICY "anyone can insert donation" ON public.donations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(name)) > 0
    AND length(trim(mobile)) BETWEEN 7 AND 20
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(trim(address)) > 0
    AND length(trim(city)) > 0
    AND length(trim(nation)) > 0
    AND amount BETWEEN 1 AND 10000000
    AND bench_count BETWEEN 1 AND 20000
  );
