create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  storage_path text not null,
  alt_text text not null default '',
  mime_type text,
  file_size bigint,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_images enable row level security;
create policy site_images_public_read on public.site_images for select using (is_active = true);
create policy site_images_admin_read on public.site_images for select to authenticated using (is_admin());
create policy site_images_admin_write on public.site_images for all to authenticated using (current_admin_role() = any (array['super_admin','admin','editor'])) with check (current_admin_role() = any (array['super_admin','admin','editor']));

insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true) on conflict (id) do nothing;
create policy site_images_storage_insert on storage.objects for insert to authenticated with check (bucket_id = 'site-images' and current_admin_role() = any (array['super_admin','admin','editor']));
create policy site_images_storage_update on storage.objects for update to authenticated using (bucket_id = 'site-images' and current_admin_role() = any (array['super_admin','admin','editor']));
create policy site_images_storage_delete on storage.objects for delete to authenticated using (bucket_id = 'site-images' and current_admin_role() = any (array['super_admin','admin','editor']));

create table if not exists public.site_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  internal_name text not null,
  title text not null,
  subtitle text not null default '',
  short_description text not null default '',
  full_description text not null default '',
  primary_button_text text not null default '',
  primary_button_url text not null default '',
  secondary_button_text text not null default '',
  secondary_button_url text not null default '',
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','hidden','archived')),
  is_visible boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_sections enable row level security;
create policy site_sections_public_read on public.site_sections for select using (status = 'published' and is_visible = true);
create policy site_sections_admin_read on public.site_sections for select to authenticated using (is_admin());
create policy site_sections_admin_write on public.site_sections for all to authenticated using (current_admin_role() = any (array['super_admin','admin','editor'])) with check (current_admin_role() = any (array['super_admin','admin','editor']));

create table if not exists public.site_videos (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  storage_path text not null,
  original_filename text not null,
  title text not null default '',
  caption text not null default '',
  mime_type text not null,
  file_size bigint not null check (file_size <= 209715200),
  duration_seconds numeric(8,3) not null check (duration_seconds <= 15),
  width integer,
  height integer,
  status text not null default 'ready' check (status in ('uploading','validating','processing','ready','failed')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_videos enable row level security;
create policy site_videos_public_read on public.site_videos for select using (status = 'ready' and is_active = true);
create policy site_videos_admin_read on public.site_videos for select to authenticated using (is_admin());
create policy site_videos_admin_write on public.site_videos for all to authenticated using (current_admin_role() = any (array['super_admin','admin','editor'])) with check (current_admin_role() = any (array['super_admin','admin','editor']));
