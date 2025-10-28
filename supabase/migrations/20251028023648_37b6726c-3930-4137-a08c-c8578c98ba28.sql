-- Create vocab_sets table for cloud sharing
create table if not exists public.vocab_sets (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  set_name text not null,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.vocab_sets enable row level security;

-- Allow anyone to read vocab sets (public sharing)
create policy "Anyone can view vocab sets"
  on public.vocab_sets
  for select
  using (true);

-- Allow anyone to insert vocab sets (public upload)
create policy "Anyone can upload vocab sets"
  on public.vocab_sets
  for insert
  with check (true);

-- Allow users to delete their own sets
create policy "Users can delete their own sets"
  on public.vocab_sets
  for delete
  using (true);

-- Create index for faster username searches
create index if not exists vocab_sets_username_idx on public.vocab_sets(username);
create index if not exists vocab_sets_created_at_idx on public.vocab_sets(created_at desc);