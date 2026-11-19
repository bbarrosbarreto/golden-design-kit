-- Destaque por portal (independente de featured/featured_order da home).
alter table public.properties
  add column if not exists export_highlight_portals text[] not null default '{}';
