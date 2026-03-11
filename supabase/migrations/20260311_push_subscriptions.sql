-- Push notification subscriptions (Web Push API)
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(endpoint)
);

-- Index for fast lookup by user
create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);

-- RLS: users can only manage their own subscriptions
alter table push_subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on push_subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Allow service_role to read all subscriptions (for Edge Functions)
-- service_role bypasses RLS automatically, so no extra policy needed.
