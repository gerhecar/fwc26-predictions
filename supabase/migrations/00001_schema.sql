-- FWC 2026 Predictions - Database Schema

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 2. TOURNAMENTS
create table if not exists public.tournaments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'locked', 'completed')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  scoring_config jsonb,
  created_at timestamptz not null default now()
);

alter table public.tournaments enable row level security;

create policy "Anyone can view active tournaments"
  on public.tournaments for select
  using (status = 'active' or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert tournaments"
  on public.tournaments for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update tournaments"
  on public.tournaments for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete tournaments"
  on public.tournaments for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 3. GROUPS
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  letter text not null check (letter in ('A','B','C','D','E','F','G','H','I','J','K','L')),
  name text,
  unique(tournament_id, letter)
);

alter table public.groups enable row level security;

create policy "Anyone can view groups"
  on public.groups for select
  using (true);

create policy "Admins can manage groups"
  on public.groups for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. TEAMS
create table if not exists public.teams (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  name text not null,
  flag_url text
);

alter table public.teams enable row level security;

create policy "Anyone can view teams"
  on public.teams for select
  using (true);

create policy "Admins can manage teams"
  on public.teams for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 5. PREDICTIONS
create table if not exists public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  first_place_team_id uuid not null references public.teams(id) on delete cascade,
  second_place_team_id uuid not null references public.teams(id) on delete cascade,
  third_place_team_id uuid not null references public.teams(id) on delete cascade,
  fourth_place_team_id uuid not null references public.teams(id) on delete cascade,
  third_place_qualified text[],
  bracket_predictions jsonb,
  champion_id uuid references public.teams(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, tournament_id, group_id)
);

alter table public.predictions enable row level security;

create policy "Users can view their own predictions"
  on public.predictions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own predictions"
  on public.predictions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own predictions"
  on public.predictions for update
  using (auth.uid() = user_id);

-- 6. MATCHES
create table if not exists public.matches (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  match_number integer not null,
  stage text not null check (stage in ('round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final')),
  home_team_id uuid references public.teams(id) on delete set null,
  away_team_id uuid references public.teams(id) on delete set null,
  winner_id uuid references public.teams(id) on delete set null,
  played_at timestamptz,
  unique(tournament_id, match_number)
);

alter table public.matches enable row level security;

create policy "Anyone can view matches"
  on public.matches for select
  using (true);

create policy "Admins can manage matches"
  on public.matches for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 7. USER GROUPS (private prediction groups)
create table if not exists public.user_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.user_groups enable row level security;

create policy "Members can view their groups"
  on public.user_groups for select
  using (
    created_by = auth.uid() or
    exists (select 1 from public.user_group_members where group_id = id and user_id = auth.uid())
  );

create policy "Users can create groups"
  on public.user_groups for insert
  with check (auth.uid() = created_by);

-- 8. USER GROUP MEMBERS
create table if not exists public.user_group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid not null references public.user_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

alter table public.user_group_members enable row level security;

create policy "Members can view group members"
  on public.user_group_members for select
  using (
    exists (select 1 from public.user_group_members where user_id = auth.uid() and group_id = group_id)
    or exists (select 1 from public.user_groups where id = group_id and created_by = auth.uid())
  );

create policy "Users can join groups"
  on public.user_group_members for insert
  with check (auth.uid() = user_id);

-- 9. STANDINGS
create table if not exists public.standings (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_group_id uuid references public.user_groups(id) on delete cascade,
  total_points integer not null default 0,
  rank integer,
  calculated_at timestamptz not null default now(),
  unique(tournament_id, user_id, user_group_id)
);

alter table public.standings enable row level security;

create policy "Anyone can view standings"
  on public.standings for select
  using (true);

create policy "Admins can manage standings"
  on public.standings for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- INDEXES
create index if not exists idx_predictions_user_tournament on public.predictions(user_id, tournament_id);
create index if not exists idx_predictions_tournament_group on public.predictions(tournament_id, group_id);
create index if not exists idx_standings_tournament on public.standings(tournament_id, total_points desc);
create index if not exists idx_standings_group on public.standings(user_group_id, total_points desc);
create index if not exists idx_matches_tournament on public.matches(tournament_id, match_number);
