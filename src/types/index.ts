export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export type TournamentStatus = 'draft' | 'active' | 'locked' | 'completed'

export type UserRole = 'user' | 'admin'

export type MatchStage =
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final'

export type MatchNumber = 73 | 74 | 75 | 76 | 77 | 78 | 79 | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88

export interface Team {
  id: string
  tournament_id: string
  name: string
  flag_url: string
  group_id: string | null
}

export interface Group {
  id: string
  tournament_id: string
  letter: GroupLetter
  name: string | null
  teams: Team[]
}

export interface Tournament {
  id: string
  name: string
  slug: string
  status: TournamentStatus
  starts_at: string
  ends_at: string
  scoring_config: ScoringConfig | null
  created_at: string
}

export interface ScoringConfig {
  group_correct_1st: number
  group_correct_2nd: number
  group_correct_3rd: number
  third_place_correct: number
  knockout_correct: number
  champion_correct: number
}

export interface GroupPrediction {
  id: string
  user_id: string
  tournament_id: string
  group_id: string
  first_place_team_id: string
  second_place_team_id: string
  third_place_team_id: string
  fourth_place_team_id: string
  third_place_qualified: string[] | null
  bracket_predictions: unknown
  champion_id: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ThirdPlaceSelection {
  user_id: string
  tournament_id: string
  qualifying_groups: GroupLetter[]
}

export interface BracketPick {
  [matchId: string]: string
}

export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  role: UserRole
}

export interface UserGroup {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
  member_count?: number
}

export interface UserGroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface Standing {
  id: string
  tournament_id: string
  user_id: string
  user_group_id: string | null
  total_points: number
  rank: number
  calculated_at: string
  profile?: Profile
}

export interface AnnexCAssignment {
  matchNumber: MatchNumber
  thirdPlaceFrom: GroupLetter
}

export interface AnnexCEntry {
  advancingGroups: GroupLetter[]
  assignments: AnnexCAssignment[]
}

export interface AdminUser {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  last_login_at: string | null
  prediction_count?: number
}

export interface AdminUserListResponse {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}

export interface AdminUserListParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'created_at' | 'display_name' | 'email' | 'role'
  sortOrder?: 'asc' | 'desc'
  roleFilter?: 'user' | 'admin' | 'all'
  statusFilter?: 'active' | 'inactive' | 'all'
}

export interface BracketMatch {
  id: number
  stage: MatchStage
  roundNumber: number
  homeTeamId: string | null
  awayTeamId: string | null
  winnerId: string | null
  childMatchIds: number[]
}

export type BetStatus = 'submitted' | 'valid' | 'deleted'

export interface AdminBet {
  id: string
  bet_name: string
  user_id: string
  display_name: string
  champion_name: string | null
  status: BetStatus
  validated_at: string | null
  validated_by: string | null
  submitted_at: string
}

export interface AdminBetDetail extends AdminBet {
  prediction_json: Record<string, unknown>
  email_sent: boolean
  email_error: string | null
}

export interface AdminBetListResponse {
  bets: AdminBet[]
  total: number
  page: number
  totalPages: number
}

export interface AdminBetListParams {
  page?: number
  limit?: number
  search?: string
  status?: BetStatus | 'all'
  sortBy?: 'submitted_at' | 'bet_name' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface TieBreakerMetrics {
  championCorrect: boolean
  finalistsCorrect: number
  semifinalistsCorrect: number
  quarterfinalistsCorrect: number
  qualifiedTeamsCorrect: number
  knockoutScore: number
}

export interface ScoreBreakdown {
  groupStage: number
  bestThirdPlaced: number
  roundOf32: number
  roundOf16: number
  quarterFinals: number
  semiFinals: number
  champion: number
}

export interface ScoreDetail {
  groupStage: Array<{ group: string; team: string; position: number; points: number; exact: boolean }>
  bestThirdPlaced: Array<{ group: string; team: string; points: number }>
  knockout: Array<{ round: string; matchNumber: number; team: string; points: number }>
}

export interface ScoreResult {
  totalScore: number
  breakdown: ScoreBreakdown
  details: ScoreDetail
}

export interface ScoringSummary {
  scoredBets: number
  skippedBets: number
  errors: string[]
  calculatedAt: string
}

export type InvitationStatus = 'active' | 'used' | 'expired' | 'revoked'

export interface BetInvitation {
  id: string
  user_id: string
  bet_slot: 1 | 2
  token: string
  status: InvitationStatus
  expires_at: string
  used_at: string | null
  used_by_name: string | null
  created_at: string
  updated_at: string
}

export type PhaseStatusValue = 'draft' | 'locked'

export interface PhaseStatusEntry {
  status: PhaseStatusValue
  lockedAt: string | null
  lockedBy: string | null
}

export interface PhaseStatus {
  groupStage: PhaseStatusEntry
  bestThirdPlaced: PhaseStatusEntry
  knockout: PhaseStatusEntry
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  betName: string
  provisionalScore: number
  provisionalScoredAt: string | null
  officialScore: number
  officialScoredAt: string | null
  totalScore: number
  status: BetStatus
  championCorrect: boolean
  finalistsCorrect: number
  semifinalistsCorrect: number
  quarterfinalistsCorrect: number
  qualifiedTeamsCorrect: number
  knockoutScore: number
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  provisionalOnly: boolean
  calculatedAt: string
}

export interface UserLeaderboardEntry {
  position: number
  displayName: string
  betName: string
  provisionalScore: number
  provisionalScoredAt: string | null
  officialScore: number | null
  officialScoredAt: string | null
  statusLabel: 'provisional' | 'official' | 'not_calculated'
  championCorrect: boolean
  finalistsCorrect: number
  semifinalistsCorrect: number
  quarterfinalistsCorrect: number
  qualifiedTeamsCorrect: number
  knockoutScore: number
}

export interface UserLeaderboardResponse {
  entries: UserLeaderboardEntry[]
  isDraft: boolean
  calculatedAt: string | null
}


