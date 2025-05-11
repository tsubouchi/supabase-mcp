alter table public.pokemons enable row level security;

create policy "Enable read for all" on public.pokemons
  for select using (true);
