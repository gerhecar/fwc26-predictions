-- FIFA World Cup 2026 - Seed Data
-- Insert the official tournament with 12 groups and 48 qualified teams

-- 1. Tournament
insert into public.tournaments (id, name, slug, status, starts_at, ends_at, scoring_config)
values (
  gen_random_uuid(),
  'FIFA World Cup 2026',
  'fifa-world-cup-2026',
  'active',
  '2026-06-11 00:00:00+00',
  '2026-07-19 00:00:00+00',
  '{"group_correct_1st": 5, "group_correct_2nd": 3, "group_correct_3rd": 1, "third_place_correct": 5, "knockout_correct": 10, "champion_correct": 25}'
);

do $$
declare
  t_id uuid;
  g_id uuid;
begin
  select id into t_id from public.tournaments where slug = 'fifa-world-cup-2026';

  -- Group A
  insert into public.groups (tournament_id, letter, name) values (t_id, 'A', 'Group A') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Argentina', 'https://flagcdn.com/w80/ar.png'),
    (t_id, g_id, 'Spain', 'https://flagcdn.com/w80/es.png'),
    (t_id, g_id, 'Saudi Arabia', 'https://flagcdn.com/w80/sa.png'),
    (t_id, g_id, 'Iran', 'https://flagcdn.com/w80/ir.png');

  -- Group B
  insert into public.groups (tournament_id, letter, name) values (t_id, 'B', 'Group B') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'England', 'https://flagcdn.com/w80/gb-eng.png'),
    (t_id, g_id, 'USA', 'https://flagcdn.com/w80/us.png'),
    (t_id, g_id, 'Wales', 'https://flagcdn.com/w80/gb-wls.png'),
    (t_id, g_id, 'Scotland', 'https://flagcdn.com/w80/gb-sct.png');

  -- Group C
  insert into public.groups (tournament_id, letter, name) values (t_id, 'C', 'Group C') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'France', 'https://flagcdn.com/w80/fr.png'),
    (t_id, g_id, 'Netherlands', 'https://flagcdn.com/w80/nl.png'),
    (t_id, g_id, 'Poland', 'https://flagcdn.com/w80/pl.png'),
    (t_id, g_id, 'Senegal', 'https://flagcdn.com/w80/sn.png');

  -- Group D
  insert into public.groups (tournament_id, letter, name) values (t_id, 'D', 'Group D') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Brazil', 'https://flagcdn.com/w80/br.png'),
    (t_id, g_id, 'Portugal', 'https://flagcdn.com/w80/pt.png'),
    (t_id, g_id, 'Mexico', 'https://flagcdn.com/w80/mx.png'),
    (t_id, g_id, 'Morocco', 'https://flagcdn.com/w80/ma.png');

  -- Group E
  insert into public.groups (tournament_id, letter, name) values (t_id, 'E', 'Group E') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Germany', 'https://flagcdn.com/w80/de.png'),
    (t_id, g_id, 'Italy', 'https://flagcdn.com/w80/it.png'),
    (t_id, g_id, 'Denmark', 'https://flagcdn.com/w80/dk.png'),
    (t_id, g_id, 'Croatia', 'https://flagcdn.com/w80/hr.png');

  -- Group F
  insert into public.groups (tournament_id, letter, name) values (t_id, 'F', 'Group F') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Belgium', 'https://flagcdn.com/w80/be.png'),
    (t_id, g_id, 'Ukraine', 'https://flagcdn.com/w80/ua.png'),
    (t_id, g_id, 'Japan', 'https://flagcdn.com/w80/jp.png'),
    (t_id, g_id, 'Canada', 'https://flagcdn.com/w80/ca.png');

  -- Group G
  insert into public.groups (tournament_id, letter, name) values (t_id, 'G', 'Group G') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Uruguay', 'https://flagcdn.com/w80/uy.png'),
    (t_id, g_id, 'Ecuador', 'https://flagcdn.com/w80/ec.png'),
    (t_id, g_id, 'Tunisia', 'https://flagcdn.com/w80/tn.png'),
    (t_id, g_id, 'Australia', 'https://flagcdn.com/w80/au.png');

  -- Group H
  insert into public.groups (tournament_id, letter, name) values (t_id, 'H', 'Group H') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Switzerland', 'https://flagcdn.com/w80/ch.png'),
    (t_id, g_id, 'Austria', 'https://flagcdn.com/w80/at.png'),
    (t_id, g_id, 'Sweden', 'https://flagcdn.com/w80/se.png'),
    (t_id, g_id, 'New Zealand', 'https://flagcdn.com/w80/nz.png');

  -- Group I
  insert into public.groups (tournament_id, letter, name) values (t_id, 'I', 'Group I') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Turkey', 'https://flagcdn.com/w80/tr.png'),
    (t_id, g_id, 'Norway', 'https://flagcdn.com/w80/no.png'),
    (t_id, g_id, 'Egypt', 'https://flagcdn.com/w80/eg.png'),
    (t_id, g_id, 'Cape Verde', 'https://flagcdn.com/w80/cv.png');

  -- Group J
  insert into public.groups (tournament_id, letter, name) values (t_id, 'J', 'Group J') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Nigeria', 'https://flagcdn.com/w80/ng.png'),
    (t_id, g_id, 'Czech Republic', 'https://flagcdn.com/w80/cz.png'),
    (t_id, g_id, 'Paraguay', 'https://flagcdn.com/w80/py.png'),
    (t_id, g_id, 'Iraq', 'https://flagcdn.com/w80/iq.png');

  -- Group K
  insert into public.groups (tournament_id, letter, name) values (t_id, 'K', 'Group K') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Korea Republic', 'https://flagcdn.com/w80/kr.png'),
    (t_id, g_id, 'DR Congo', 'https://flagcdn.com/w80/cd.png'),
    (t_id, g_id, 'Qatar', 'https://flagcdn.com/w80/qa.png'),
    (t_id, g_id, 'Jordan', 'https://flagcdn.com/w80/jo.png');

  -- Group L
  insert into public.groups (tournament_id, letter, name) values (t_id, 'L', 'Group L') returning id into g_id;
  insert into public.teams (tournament_id, group_id, name, flag_url) values
    (t_id, g_id, 'Colombia', 'https://flagcdn.com/w80/co.png'),
    (t_id, g_id, 'Ghana', 'https://flagcdn.com/w80/gh.png'),
    (t_id, g_id, 'Ivory Coast', 'https://flagcdn.com/w80/ci.png'),
    (t_id, g_id, 'Haiti', 'https://flagcdn.com/w80/ht.png');

end $$;
