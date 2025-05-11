create table if not exists public.pokemons (
  id bigserial primary key,
  national_no integer unique not null,
  name_ja text not null,
  type_1 text not null,
  type_2 text,
  inserted_at timestamptz default now()
);
