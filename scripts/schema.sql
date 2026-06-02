-- FWC 2026 Predictions - MySQL Schema

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL DEFAULT NULL,
  banned_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS tournaments (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('draft', 'active', 'locked', 'completed') NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  scoring_config JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `groups` (
  id VARCHAR(36) PRIMARY KEY,
  tournament_id VARCHAR(36) NOT NULL,
  letter CHAR(1) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  UNIQUE KEY uk_tournament_letter (tournament_id, letter),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(36) PRIMARY KEY,
  tournament_id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  flag_url VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS predictions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tournament_id VARCHAR(36) NOT NULL,
  group_id VARCHAR(36) NOT NULL,
  first_place_team_id VARCHAR(36) NOT NULL,
  second_place_team_id VARCHAR(36) NOT NULL,
  third_place_team_id VARCHAR(36) NOT NULL,
  fourth_place_team_id VARCHAR(36) NOT NULL,
  third_place_qualified JSON DEFAULT NULL,
  bracket_predictions JSON DEFAULT NULL,
  champion_id VARCHAR(36) DEFAULT NULL,
  status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_tournament_group (user_id, tournament_id, group_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
  FOREIGN KEY (first_place_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (second_place_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (third_place_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (fourth_place_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (champion_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(36) PRIMARY KEY,
  tournament_id VARCHAR(36) NOT NULL,
  match_number INT NOT NULL,
  stage ENUM('round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final') NOT NULL,
  home_team_id VARCHAR(36) DEFAULT NULL,
  away_team_id VARCHAR(36) DEFAULT NULL,
  winner_id VARCHAR(36) DEFAULT NULL,
  played_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY uk_tournament_match (tournament_id, match_number),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_groups (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  invite_code VARCHAR(20) NOT NULL UNIQUE,
  created_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_group_members (
  id VARCHAR(36) PRIMARY KEY,
  group_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_group_user (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS standings (
  id VARCHAR(36) PRIMARY KEY,
  tournament_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  user_group_id VARCHAR(36) DEFAULT NULL,
  total_points INT NOT NULL DEFAULT 0,
  `rank` INT DEFAULT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tournament_user_group (tournament_id, user_id, user_group_id),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bet_submissions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  bet_name VARCHAR(255) NOT NULL,
  prediction_json JSON NOT NULL,
  champion_name VARCHAR(255) DEFAULT NULL,
  status ENUM('submitted', 'valid', 'deleted') NOT NULL DEFAULT 'submitted',
  validated_at TIMESTAMP NULL DEFAULT NULL,
  validated_by VARCHAR(36) DEFAULT NULL,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_error VARCHAR(500) DEFAULT NULL,
  submitted_via_invitation BOOLEAN NOT NULL DEFAULT FALSE,
  invitation_id VARCHAR(36) DEFAULT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_bet_name (user_id, bet_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bet_invitations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  bet_slot TINYINT NOT NULL,
  token VARCHAR(128) NOT NULL UNIQUE,
  status ENUM('active', 'used', 'expired', 'revoked') NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  used_by_name VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bet_invitations_token ON bet_invitations(token);
CREATE INDEX idx_bet_invitations_user ON bet_invitations(user_id);
CREATE INDEX idx_bet_invitations_user_slot ON bet_invitations(user_id, bet_slot);

CREATE TABLE IF NOT EXISTS official_results (
  id VARCHAR(36) PRIMARY KEY,
  tournament_id VARCHAR(36) NOT NULL,
  results_json JSON NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  phase_status JSON DEFAULT NULL,
  updated_by VARCHAR(36) DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX idx_predictions_user_tournament ON predictions(user_id, tournament_id);
CREATE INDEX idx_predictions_tournament_group ON predictions(tournament_id, group_id);
CREATE INDEX idx_standings_tournament ON standings(tournament_id, total_points DESC);
CREATE INDEX idx_standings_group ON standings(user_group_id, total_points DESC);
CREATE INDEX idx_matches_tournament ON matches(tournament_id, match_number);
CREATE INDEX idx_bet_submissions_user ON bet_submissions(user_id);
