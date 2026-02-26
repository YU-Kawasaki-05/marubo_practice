create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null,
  storage_path text not null,
  mime_type text,
  size_bytes int,
  created_at timestamptz not null default now()
);

create index if not exists idx_attachments_message_created_at
  on attachments(message_id, created_at asc);

alter table attachments enable row level security;

create policy attachments_owner_all
  on attachments
  for all
  using (
    exists (
      select 1 from messages m
      join conversations c on c.id = m.conversation_id
      where m.id = attachments.message_id
        and c.user_id = auth.uid()
        and c.user_id = attachments.user_id
    )
  )
  with check (
    exists (
      select 1 from messages m
      join conversations c on c.id = m.conversation_id
      where m.id = attachments.message_id
        and c.user_id = auth.uid()
        and c.user_id = attachments.user_id
    )
  );

create policy attachments_staff_all
  on attachments
  for all
  using (coalesce((auth.jwt()->'app_metadata'->>'role'),'') = 'staff')
  with check (coalesce((auth.jwt()->'app_metadata'->>'role'),'') = 'staff');
