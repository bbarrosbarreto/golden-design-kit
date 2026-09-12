-- Etapa 1 — Exportação de anúncios para portais imobiliários
-- Rodar no SQL Editor do Supabase.

-- Endereço estruturado (o padrão ZAP exige CEP e Bairro; sem eles o
-- anúncio é descartado pelo portal)
alter table public.properties
  add column if not exists street          text,
  add column if not exists street_number   text,
  add column if not exists complement      text,
  add column if not exists neighborhood    text,
  add column if not exists city            text not null default 'Brasília',
  add column if not exists state           text not null default 'DF',
  add column if not exists postal_code     text,
  add column if not exists latitude        numeric,
  add column if not exists longitude       numeric;

-- Valores que os portais leem em campos separados
alter table public.properties
  add column if not exists rent_price      numeric,
  add column if not exists condo_fee       numeric,
  add column if not exists iptu            numeric,
  add column if not exists year_built      smallint,
  add column if not exists living_rooms    integer;

-- Categoria fina exigida pelo padrão ZAP (CategoriaImovel)
alter table public.properties
  add column if not exists category text not null default 'padrao'
  check (category in (
    'padrao','terrea','sobrado_duplex','sobrado_triplex',
    'cobertura','cobertura_duplex','cobertura_triplex'
  ));

-- Controle de exportação, por anúncio e por portal
alter table public.properties
  add column if not exists export_enabled boolean not null default false,
  add column if not exists export_portals text[] not null default '{}',
  add column if not exists listing_code   text unique;

-- Código estável, nunca muda depois de gerado
create sequence if not exists public.listing_code_seq start 1000;

alter table public.properties
  alter column listing_code set default 'BB' || nextval('public.listing_code_seq');

update public.properties
  set listing_code = 'BB' || nextval('public.listing_code_seq')
  where listing_code is null;

create index if not exists properties_export_idx
  on public.properties (export_enabled, active, status);
