alter table donations add column if not exists ref_slug text;

create index if not exists donations_ref_slug_idx on donations (ref_slug) where ref_slug is not null;
