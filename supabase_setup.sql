-- 1. Create a storage bucket for case files
insert into storage.buckets (id, name, public)
values ('case-files', 'case-files', true);

-- 2. Allow public access to the bucket (for viewing files)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'case-files' );

-- 3. Allow authenticated users to upload files
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'case-files' and auth.role() = 'authenticated' );

-- 4. Allow users to delete their own files
create policy "Users can delete their own files"
  on storage.objects for delete
  using ( bucket_id = 'case-files' and auth.uid() = owner );


-- 5. Create a table for Case Templates
create table case_templates (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text, -- e.g., 'Civil', 'Criminal', 'Family'
  default_notes text,
  default_tasks jsonb, -- e.g., ["File Petition", "Serve Notice"]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Insert some default templates
insert into case_templates (title, category, default_notes) values
  ('Divorce Petition', 'Family', 'Standard divorce petition. Requires marriage certificate and proof of residency.'),
  ('Criminal Defense', 'Criminal', 'Defense against criminal charges. Check police report and witness statements.'),
  ('Property Dispute', 'Civil', 'Dispute regarding property boundaries or ownership. Requires land registry documents.'),
  ('Corporate Merger', 'Corporate', 'Merger or acquisition of a company. Due diligence required.');

-- 7. Enable RLS on templates (Everyone can read, admins can write - for now just open read)
alter table case_templates enable row level security;

create policy "Enable read access for all users"
  on case_templates for select
  using ( true );
