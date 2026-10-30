-- Groupe E et membres manquants. Aucune saisie fictive.
insert into public.amc_groups (id, campaign_id, code, label) values
  ('caravane-11-E', 'caravane-11', 'E', 'Groupe E')
on conflict (id) do nothing;

insert into public.amc_members (id, group_id, name, sort_order) values
  ('E-ashraf', 'caravane-11-E', 'Ashraf', 1),
  ('E-chaymaa', 'caravane-11-E', 'Chaymaa', 2)
on conflict (id) do nothing;
