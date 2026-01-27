-- Draft migration for chat history persistence (not yet applied)
-- Apply with: pnpm supabase db push
-- NOTE: Confirm in staging before production.

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- indexes for common access patterns
create index if not exists idx_conversations_user_created_at
  on conversations(user_id, created_at desc);

create index if not exists idx_messages_conversation_created_at
  on messages(conversation_id, created_at asc);

-- RLS
alter table conversations enable row level security;
alter table messages enable row level security;

-- policy: owner can CRUD their conversations
create policy if not exists conversations_owner_all
  on conversations
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- policy: staff can do everything (assumes app_metadata.role = 'staff')
create policy if not exists conversations_staff_all
  on conversations
  for all
  using (coalesce(auth.jwt()->>'app_metadata'::text::json->>'role','') = 'staff')
  with check (coalesce(auth.jwt()->>'app_metadata'::text::json->>'role','') = 'staff');

-- policy: messages follow parent conversation ownership
create policy if not exists messages_owner_all
  on messages
  for all
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and c.user_id = auth.uid()
    )
  );

create policy if not exists messages_staff_all
  on messages
  for all
  using (coalesce(auth.jwt()->>'app_metadata'::text::json->>'role','') = 'staff')
  with check (coalesce(auth.jwt()->>'app_metadata'::text::json->>'role','') = 'staff');

comment on table conversations is 'Chat conversation rooms (one per thread)';
comment on table messages is 'Messages belonging to a conversation (ordered by created_at asc)';
