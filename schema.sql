-- ACX Flow · espace AMC
-- Association Morocco's Creativity
-- Campagne : Caravane humanitaire, 11e édition
-- Douar Ilissi, région d'Azilal, 26 et 27 décembre 2026
--
-- Même projet Supabase « FLOW » que Juridique.
-- Tables préfixées amc_ pour ne rien écraser.
-- RLS activé, aucune policy anon : Juridique ne doit pas lire AMC, et l'inverse.
-- Les adresses se brancheront plus tard, depuis le login Flow. Aucun e-mail inventé ici.
-- La collecte réelle part à zéro. Les objectifs ci-dessous sont une proposition, modifiable.

create table if not exists public.amc_operators (
  email text primary key,
  role text not null default 'saisie' check (role in ('saisie', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.amc_campaigns (
  id text primary key,
  name text not null,
  edition int not null,
  place text not null,
  region text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'collecte' check (status in ('collecte', 'preparation', 'distribution', 'clos')),
  created_at timestamptz not null default now()
);

create table if not exists public.amc_groups (
  id text primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  code text not null,
  label text not null,
  unique (campaign_id, code)
);

create table if not exists public.amc_members (
  id text primary key,
  group_id text not null references public.amc_groups(id) on delete cascade,
  name text not null,
  sort_order int not null
);

create table if not exists public.amc_item_types (
  id text primary key,
  label text not null,
  unit text not null,
  is_money boolean not null default false,
  sort_order int not null
);

create table if not exists public.amc_targets (
  id bigint generated always as identity primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  item_id text not null references public.amc_item_types(id),
  qty numeric not null check (qty >= 0),
  proposed boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (campaign_id, item_id)
);

create table if not exists public.amc_entries (
  id bigint generated always as identity primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  group_id text not null references public.amc_groups(id),
  member_id text references public.amc_members(id),
  item_id text not null references public.amc_item_types(id),
  qty numeric not null check (qty <> 0),
  author text not null default 'Saisie',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.amc_prep_lines (
  id bigint generated always as identity primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  item_id text not null references public.amc_item_types(id),
  ready_qty numeric not null default 0 check (ready_qty >= 0),
  rejected_qty numeric not null default 0 check (rejected_qty >= 0),
  note text,
  updated_at timestamptz not null default now(),
  unique (campaign_id, item_id)
);

create table if not exists public.amc_trips (
  id text primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  label text not null,
  role text not null,
  lead_name text,
  depart_at timestamptz,
  arrive_at timestamptz,
  loaded boolean not null default false,
  departed boolean not null default false,
  arrived boolean not null default false
);

create table if not exists public.amc_notices (
  id bigint generated always as identity primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.amc_distributions (
  id bigint generated always as identity primary key,
  campaign_id text not null references public.amc_campaigns(id) on delete cascade,
  item_id text not null references public.amc_item_types(id),
  taken_qty numeric not null default 0 check (taken_qty >= 0),
  given_qty numeric not null default 0 check (given_qty >= 0),
  households int,
  note text,
  updated_at timestamptz not null default now(),
  unique (campaign_id, item_id)
);

create index if not exists amc_entries_campaign_idx on public.amc_entries (campaign_id, created_at desc);
create index if not exists amc_entries_group_idx on public.amc_entries (group_id);

alter table public.amc_operators enable row level security;
alter table public.amc_campaigns enable row level security;
alter table public.amc_groups enable row level security;
alter table public.amc_members enable row level security;
alter table public.amc_item_types enable row level security;
alter table public.amc_targets enable row level security;
alter table public.amc_entries enable row level security;
alter table public.amc_prep_lines enable row level security;
alter table public.amc_trips enable row level security;
alter table public.amc_notices enable row level security;
alter table public.amc_distributions enable row level security;

-- Pas de policy anon. À ouvrir seulement pour les mails déposés dans amc_operators.
-- Exemple, à décommenter après le login Flow :
-- create policy amc_read on public.amc_entries
--   for select to authenticated
--   using (exists (
--     select 1 from public.amc_operators o
--     where lower(o.email) = lower(auth.jwt() ->> 'email')
--   ));

insert into public.amc_campaigns (id, name, edition, place, region, starts_on, ends_on, status)
values ('caravane-11', 'Caravane humanitaire', 11, 'Douar Ilissi', 'Azilal', '2026-12-26', '2026-12-27', 'collecte')
on conflict (id) do nothing;

insert into public.amc_groups (id, campaign_id, code, label) values
  ('caravane-11-A', 'caravane-11', 'A', 'Groupe A'),
  ('caravane-11-B', 'caravane-11', 'B', 'Groupe B'),
  ('caravane-11-C', 'caravane-11', 'C', 'Groupe C'),
  ('caravane-11-D', 'caravane-11', 'D', 'Groupe D')
on conflict (id) do nothing;

insert into public.amc_members (id, group_id, name, sort_order) values
  ('A-safaa', 'caravane-11-A', 'Safaa', 1),
  ('A-yahya', 'caravane-11-A', 'Yahya', 2),
  ('A-nour', 'caravane-11-A', 'Nour', 3),
  ('A-fatiha', 'caravane-11-A', 'Fatiha', 4),
  ('A-badr', 'caravane-11-A', 'Badr', 5),
  ('A-nadia', 'caravane-11-A', 'Nadia', 6),
  ('B-zineb', 'caravane-11-B', 'Zineb', 1),
  ('B-hamza', 'caravane-11-B', 'Hamza', 2),
  ('B-aicha', 'caravane-11-B', 'Aicha', 3),
  ('B-yusur', 'caravane-11-B', 'Yusur', 4),
  ('B-salma', 'caravane-11-B', 'Salma', 5),
  ('B-moncef', 'caravane-11-B', 'Moncef', 6),
  ('C-yassir', 'caravane-11-C', 'Yassir', 1),
  ('C-bouchra', 'caravane-11-C', 'Bouchra', 2),
  ('C-zakaria', 'caravane-11-C', 'Zakaria', 3),
  ('C-mouhcine', 'caravane-11-C', 'Mouhcine', 4),
  ('C-maroua', 'caravane-11-C', 'Maroua', 5),
  ('C-wissal', 'caravane-11-C', 'Wissal', 6),
  ('D-bouchra', 'caravane-11-D', 'Bouchra', 1),
  ('D-hasnaa', 'caravane-11-D', 'Hasnaa', 2),
  ('D-ilyass', 'caravane-11-D', 'Ilyass', 3),
  ('D-mohamed', 'caravane-11-D', 'Mohamed', 4),
  ('D-ahmed', 'caravane-11-D', 'Ahmed', 5),
  ('D-malak', 'caravane-11-D', 'Malak', 6)
on conflict (id) do nothing;

insert into public.amc_item_types (id, label, unit, is_money, sort_order) values
  ('pantalons', 'Pantalons', 'pièce', false, 1),
  ('pulls', 'Pulls en laine', 'pièce', false, 2),
  ('pyjamas', 'Pyjamas', 'pièce', false, 3),
  ('peignoirs', 'Peignoirs', 'pièce', false, 4),
  ('djellaba_f', 'Djellabas femmes', 'pièce', false, 5),
  ('djellaba_h', 'Djellabas hommes', 'pièce', false, 6),
  ('jackets', 'Jackets', 'pièce', false, 7),
  ('manteaux', 'Manteaux', 'pièce', false, 8),
  ('chales', 'Châles', 'pièce', false, 9),
  ('argent', 'Dons', 'MAD', true, 10),
  ('paniers', 'Paniers', 'panier', false, 12),
  ('tri', 'Tri', 'tri', false, 13),
  ('deplacement', 'Déplacement', 'déplacement', false, 14),
  ('paniers2', 'Panier 2', 'panier', false, 15)
on conflict (id) do nothing;

insert into public.amc_targets (campaign_id, item_id, qty, proposed) values
  ('caravane-11', 'pantalons', 120, true),
  ('caravane-11', 'pulls', 120, true),
  ('caravane-11', 'pyjamas', 80, true),
  ('caravane-11', 'peignoirs', 40, true),
  ('caravane-11', 'djellaba_f', 40, true),
  ('caravane-11', 'djellaba_h', 40, true),
  ('caravane-11', 'jackets', 60, true),
  ('caravane-11', 'manteaux', 48, true),
  ('caravane-11', 'chales', 80, true),
  ('caravane-11', 'argent', 20000, true)
on conflict (campaign_id, item_id) do nothing;

insert into public.amc_notices (campaign_id, title, body, created_at) values
  ('caravane-11', 'Collecte ouverte', 'La collecte d’hiver est ouverte. Pantalons, pulls en laine, pyjamas, peignoirs, djellabas, jackets, manteaux, châles, et les dons.', '2026-10-24 09:00:00+00'),
  ('caravane-11', 'Rappel de la caravane', 'Douar Ilissi, région d’Azilal, les 26 et 27 décembre 2026. Merci de transmettre les quantités au poste de saisie.', '2026-10-26 18:00:00+00');

insert into public.amc_trips (id, campaign_id, label, role) values
  ('caravane-11-fourgon-1', 'caravane-11', 'Fourgon 1', 'Vêtements'),
  ('caravane-11-vehicule-2', 'caravane-11', 'Véhicule 2', 'Relais')
on conflict (id) do nothing;
