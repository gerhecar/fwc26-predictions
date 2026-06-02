export interface RuleSection {
  id: string
  title: string
  content: string[]
}

export const RULES: RuleSection[] = [
  {
    id: 'objective',
    title: 'Objective',
    content: [
      'The objective of this prediction game is to correctly predict as many results as possible of the FIFA World Cup 2026.',
      'Each participant must predict the outcome of each group, the teams classified as best third-placed, and the winner of each knockout stage match, including the world champion.',
      'The participant with the most points at the end of the tournament will be the winner.',
    ],
  },
  {
    id: 'participation',
    title: 'Participation Rules',
    content: [
      'Each user can create a maximum of 2 bets (predictions) for the entire tournament.',
      'Each bet must have a unique name for the user.',
      'Bets can be created directly by the user or through an invitation link sent to an external guest.',
      'External guests do not need to register or sign in. They complete the prediction through a unique link and the bet is saved under the account of the user who generated the invitation.',
      'Each invitation link is single-use, valid for 7 days, and can be revoked by the user at any time.',
      'Once submitted, the bet remains in "pending" status until an administrator validates it.',
      'Only bets validated by an administrator are eligible for scoring and appear on the leaderboard.',
    ],
  },
  {
    id: 'phases',
    title: 'Tournament Prediction Phases',
    content: [
      'The tournament is divided into three main phases for prediction:',
      '',
      'Group Stage: Predict the exact position (1st to 4th) of each team in each of the 12 groups (A to L).',
      '',
      'Best Third-Placed: Select which 4 groups will provide the best third-placed teams that advance to the round of 32.',
      '',
      'Knockout Stage: Predict the winner of each match from the round of 32 (R32) to the final, including the world champion.',
    ],
  },
  {
    id: 'scoring',
    title: 'Scoring System',
    content: [
      'Points are assigned as follows according to the phase and accuracy of the prediction:',
      '',
      'GROUP STAGE:',
      '• Exact position (1st or 2nd): 10 points per team.',
      '• Correct team but incorrect position (e.g. you have them in the group but in another spot): 5 points per team.',
      '• Team not present in the actual group: 0 points.',
      '',
      'BEST THIRD-PLACED:',
      '• Correctly predicting a team classified as best third-placed: 10 points per team.',
      '',
      'KNOCKOUT STAGE:',
      '• R32 (Round of 32): 20 points per correct team.',
      '• R16 (Round of 16): 35 points per correct team.',
      '• QF (Quarter Finals): 50 points per correct team.',
      '• SF (Semi Finals): 75 points per correct team.',
      '• Champion: 150 points.',
      '',
      'Points accumulate throughout the tournament. There is no maximum point limit.',
    ],
  },
  {
    id: 'scores-table',
    title: 'Scoring Summary Table',
    content: [],
  },
  {
    id: 'leaderboard',
    title: 'Leaderboard',
    content: [
      'The leaderboard shows the ranking of all validated bets, ordered by total score from highest to lowest.',
      '',
      'While the tournament is in progress and results are drafts, the leaderboard shows provisional scores.',
      'Provisional scores are calculated automatically whenever the administrator saves results.',
      'Once a phase is locked by the administrator, scores for that phase become official.',
      'When all phases are locked, the leaderboard shows final official scores.',
      '',
      'Official scores only include points from phases that have been locked. Draft phases do not contribute to the official score.',
    ],
  },
  {
    id: 'tiebreakers',
    title: 'Tiebreaker Rules',
    content: [
      'If two or more bets have the same total score, the following tiebreaker criteria are applied in order:',
      '',
      '1. Correct Champion: The bet that correctly predicted the world champion has priority.',
      '2. Correct Finalists: Highest number of correct finalists (semi final winners).',
      '3. Correct Semi Finalists: Highest number of correct semi finalists (quarter final winners).',
      '4. Correct Quarter Finalists: Highest number of correct quarter finalists (round of 16 winners).',
      '5. Correct Qualified Teams: Highest number of correct teams that advanced from the group stage (1st and 2nd of each group + best third-placed). Position does not matter.',
      '6. Knockout Score: Highest score obtained only in the knockout stage (R32 + R16 + QF + SF + Champion).',
      '7. Submission Date: The earliest submitted bet has priority.',
      '',
      'If after applying all criteria the bets are still tied, they share the same position in the ranking.',
    ],
  },
  {
    id: 'fairplay',
    title: 'Fair Play and Administration',
    content: [
      'Tournament administrators reserve the right to validate, modify, or delete any bet that does not comply with the rules.',
      'Any attempt at manipulation, use of multiple accounts, or fraudulent behavior will result in disqualification of the participant.',
      'Administrator decisions are final.',
      'Official tournament results are the source of truth for scoring. Any controversy will be resolved by the administrators.',
      'The leaderboard is updated automatically as results are saved and phases are locked.',
    ],
  },
  {
    id: 'goodluck',
    title: 'Good Luck!',
    content: [
      'Let the game begin. May the best predictor win.',
      'Good luck to all participants!',
    ],
  },
]

export const SCORING_TABLE = [
  { phase: 'Groups — Exact Position', points: 10 },
  { phase: 'Groups — Incorrect Position', points: 5 },
  { phase: 'Best Third-Placed', points: 10 },
  { phase: 'R32 (Round of 32)', points: 20 },
  { phase: 'R16 (Round of 16)', points: 35 },
  { phase: 'QF (Quarter Finals)', points: 50 },
  { phase: 'SF (Semi Finals)', points: 75 },
  { phase: 'Champion', points: 150 },
]
