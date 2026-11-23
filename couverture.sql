-- ACX Flow · AMC — ajout de l'article Couverture
-- Migration idempotente : exécuter dans Supabase SQL Editor si la base existe déjà.
insert into public.amc_item_types (id, label, unit, is_money, sort_order)
values ('couverture', 'Couverture', 'pièce', false, 16)
on conflict (id) do update set label = excluded.label, unit = excluded.unit, is_money = excluded.is_money, sort_order = excluded.sort_order;

insert into public.amc_targets (campaign_id, item_id, qty, proposed)
values ('caravane-11', 'couverture', 0, true)
on conflict (campaign_id, item_id) do nothing;
