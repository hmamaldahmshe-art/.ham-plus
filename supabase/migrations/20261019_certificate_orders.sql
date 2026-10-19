-- HAM PLUS: customer device registration orders.
-- Execute only in the dedicated Supabase ham-plus project SQL editor.
-- No policies for anon/authenticated users. Only the server's service role may access the table.
create table if not exists public.ham_certificate_orders (
  id uuid primary key,
  customer_name varchar(70) not null check (length(btrim(customer_name)) > 0),
  device_name varchar(70) not null check (length(btrim(device_name)) > 0),
  token_hash char(64) not null check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending'
    check (status in ('pending','processing','ready','delivered','cancelled')),
  udid varchar(60),
  source varchar(30),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ham_udid_format check (
    udid is null or udid ~* '^([0-9a-f]{40}|[0-9a-f]{8}-[0-9a-f]{16})$'
  ),
  constraint ham_udid_source check (
    source is null or source in ('manual-unverified')
  )
);
alter table public.ham_certificate_orders enable row level security;
revoke all on public.ham_certificate_orders from anon, authenticated;
grant select, insert, update, delete on public.ham_certificate_orders to service_role;
create index if not exists ham_certificate_orders_created_idx
  on public.ham_certificate_orders (created_at desc);
comment on table public.ham_certificate_orders is
  'Private customer consent and device registration requests for HAM. Never expose the server-side key.';
