export interface Game {
  id: string;

  awayBatter: string;
  awayTeam: string;
  awayTeamName: string;
  awayTeamNickname: string;
  awayTeamEmoji: string;
  baseRunners: string[];
  day: number;
  gameComplete: boolean;
  homeBatter: string;
  homeTeam: string;
  homeTeamName: string;
  homeTeamNickname: string;
  homeTeamEmoji: string;
  season: number;
  statsheet: string;
}

export interface GameStatsheet {
  id: string;
  awayTeamRunsByInning: number[];
  homeTeamRunsByInning: number[];
  awayTeamStats: string;
  homeTeamStats: string;
}

export interface TeamStatsheet {
  id: string;
  team: string;
  playerStats: string[];
}

export interface PlayerStatsheet {
  id: string;
  playerId: string;
  name: string;
  team: string;
  teamId: string;

  // TODO verify if all of these are actually in use
  atBats: number;
  caughtStealing: number;
  doubles: number;
  earnedRuns: number;
  groundIntoDp: number;
  hitBatters: number;
  hitByPitch: number;
  hits: number;
  hitsAllowed: number;
  homeRuns: number;
  losses: number;
  outsRecorded: number;
  pitchesThrown: number;
  quadruples: number;
  rbis: number;
  runs: number;
  stolenBases: number;
  strikeouts: number;
  struckouts: number;
  triples: number;
  walks: number;
  walksIssued: number;
  wins: number;
}
