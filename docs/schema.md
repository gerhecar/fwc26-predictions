# FWC 2026 Predictions - Database Schema

## Tables

### profiles
Extends `auth.users` with display name and role.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | References auth.users |
| display_name | text | |
| avatar_url | text | nullable |
| role | text | 'user' or 'admin' |
| created_at | timestamptz | |

### tournaments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| slug | text UNIQUE | URL-friendly |
| status | text | draft, active, locked, completed |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| scoring_config | jsonb | Flexible scoring rules |

### groups
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK | |
| letter | text | A-L |
| name | text | nullable |

UK: (tournament_id, letter)

### teams
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK | |
| group_id | uuid FK | nullable |
| name | text | |
| flag_url | text | |

### predictions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | |
| tournament_id | uuid FK | |
| group_id | uuid FK | |
| first_place_team_id | uuid FK | |
| second_place_team_id | uuid FK | |
| third_place_team_id | uuid FK | |
| fourth_place_team_id | uuid FK | |
| third_place_qualified | text[] | Group letters of qualifying 3rd place teams |
| bracket_predictions | jsonb | Map of match_number -> team_id |
| champion_id | uuid FK | nullable |
| status | text | draft or submitted |

UK: (user_id, tournament_id, group_id)

### matches
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK | |
| match_number | int | 1-104 |
| stage | text | round_of_32, round_of_16, etc. |
| home_team_id | uuid FK | nullable |
| away_team_id | uuid FK | nullable |
| winner_id | uuid FK | nullable (real result) |
| played_at | timestamptz | nullable |

### user_groups
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| invite_code | text UNIQUE | 8-char code |
| created_by | uuid FK | |

### user_group_members
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| group_id | uuid FK | |
| user_id | uuid FK | |
| joined_at | timestamptz | |

UK: (group_id, user_id)

### standings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| tournament_id | uuid FK | |
| user_id | uuid FK | |
| user_group_id | uuid FK | nullable (NULL = global) |
| total_points | int | |
| rank | int | nullable |
| calculated_at | timestamptz | |
