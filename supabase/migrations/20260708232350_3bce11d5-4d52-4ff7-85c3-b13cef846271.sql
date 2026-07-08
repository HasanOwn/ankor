DROP POLICY IF EXISTS "Anyone can upload vocab sets" ON public.vocab_sets;

CREATE POLICY "Anyone can upload valid vocab sets"
ON public.vocab_sets
FOR INSERT
TO public
WITH CHECK (
  username IS NOT NULL
  AND length(btrim(username)) BETWEEN 1 AND 60
  AND set_name IS NOT NULL
  AND length(btrim(set_name)) BETWEEN 1 AND 120
  AND jsonb_typeof(data) = 'object'
  AND pg_column_size(data) < 1048576
);