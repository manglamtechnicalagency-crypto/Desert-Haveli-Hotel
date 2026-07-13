create table if not exists public.site_gallery_images (
  id uuid primary key default gen_random_uuid(),
  section_key text not null default 'room-gallery',
  storage_path text not null,
  category text not null default 'Rooms',
  title text not null default '',
  alt_text text not null default '',
  caption text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_gallery_images enable row level security;
drop policy if exists site_gallery_images_public_read on public.site_gallery_images;
drop policy if exists site_gallery_images_admin_read on public.site_gallery_images;
drop policy if exists site_gallery_images_admin_write on public.site_gallery_images;
create policy site_gallery_images_public_read on public.site_gallery_images for select using (is_active = true);
create policy site_gallery_images_admin_read on public.site_gallery_images for select to authenticated using (is_admin());
create policy site_gallery_images_admin_write on public.site_gallery_images for all to authenticated using (current_admin_role() = any (array['super_admin','admin','editor'])) with check (current_admin_role() = any (array['super_admin','admin','editor']));

