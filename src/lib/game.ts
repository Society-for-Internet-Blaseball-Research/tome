/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { BLASEBALL_ROOT } from "./env";
import { Game, GameStatsheet, TeamStatsheet, PlayerStatsheet, Team } from "./data";

interface GameDataHookReturn {
  error: any;
  game: Game | undefined;
  stats: {
    game: GameStatsheet[];
    team: TeamStatsheet[];
    player: PlayerStatsheet[];
  };
}

export async function fetchJson<T>(
  url: string,
  query?: { [key: string]: string }
): Promise<T> {
  const qs =
    query === undefined ? "" : `?${new URLSearchParams(query).toString()}`;
  return fetch(`${url}${qs}`).then((res) => res.json());
}

let stream: EventSource | undefined;

function setupStream(gameId: string, setGame: any) {
  if (stream !== undefined) {
    stream.close();
  }
  stream = new EventSource(`${BLASEBALL_ROOT}/events/streamData`);
  stream.addEventListener("open", () => {
    console.log(`listening for game updates (id=${gameId})`); // eslint-disable-line no-console
  });

  stream.addEventListener("message", (event) => {
    const g = JSON.parse(event.data).value?.games?.schedule?.find(
      (game: Game) => game.id === gameId
    );
    if (g) {
      setGame(g);
      if (g.gameComplete && stream !== undefined) {
        stream.close();
      }
    }
  });

  stream.addEventListener("error", () => {
    console.log(`restarting stream ${gameId}`); // eslint-disable-line no-console
    if (stream !== undefined) {
      stream.close();
    }
    setTimeout(() => setupStream(gameId, setGame), 2000);
  });
}

async function makeLineupOrder(teamId: string) {
  return fetchJson<Team>(`${BLASEBALL_ROOT}/database/team?id=${teamId}`)
  .then((team) => {
    const res = new Map()
    for (var i = 0; i < team.lineup.length; i++) {
      res.set(team.lineup[i], i);
    }
    return res;
  });
}

export function useGameData(id: string): GameDataHookReturn {
  const [error, setError] = useState<any>();

  // game data
  const [gameData, setGame] = useState<Game | undefined>();
  const [lineupOrder, setlineupOrder] = useState<Map<string, number>>();
  if (stream !== undefined) {
    stream.close();
    stream = undefined;
  }
  useEffect(() => {
    fetchJson<Game>(`${BLASEBALL_ROOT}/database/gameById/${id}`)
      // eslint-disable-next-line consistent-return
      .then((data) => {
        setGame(data);
        if (data && !data.gameComplete) {
          setupStream(id, setGame);
        }
        Promise.all([
          makeLineupOrder(data.awayTeam),
          makeLineupOrder(data.homeTeam)
        ]).then((values) => {
          setlineupOrder(new Map([...values[0], ...values[1]]));
        });
      })
      .catch((err) => setError(err));
  }, [id]);

  // this is used as a dependency for statsheet hooks. if these parts of the
  // game state change, we expect a statsheet update has also occurred, and we
  // should re-fetch.
  const updateStatsOn = [
    gameData?.baseRunners,
    gameData?.awayBatter,
    gameData?.homeBatter,
  ];

  // game statsheet
  const [gameStatsheets, setGameStatsheets] = useState<GameStatsheet[]>([]);
  useEffect(() => {
    if (gameData?.statsheet !== undefined) {
      fetchJson<GameStatsheet[]>(`${BLASEBALL_ROOT}/database/gameStatsheets`, {
        ids: gameData.statsheet,
      })
        .then((data) => setGameStatsheets(data))
        .catch((err) => setError(err));
    }
  }, [gameData?.statsheet, ...updateStatsOn]);

  // team statsheets
  const [teamStatsheets, setTeamStatsheets] = useState<TeamStatsheet[]>([]);
  useEffect(() => {
    const ids = gameStatsheets.flatMap((sheet) => [
      sheet.awayTeamStats,
      sheet.homeTeamStats,
    ]);
    if (ids.length > 0) {
      fetchJson<TeamStatsheet[]>(`${BLASEBALL_ROOT}/database/teamStatsheets`, {
        ids: ids.join(","),
      })
        .then((data) => setTeamStatsheets(data))
        .catch((err) => setError(err));
    }
  }, [gameStatsheets]);

  // player statsheets
  const [playerStatsheets, setPlayerStatsheets] = useState<PlayerStatsheet[]>(
    []
  );
  useEffect(() => {
    const ids = teamStatsheets.flatMap((sheet) => sheet.playerStats);
    if (ids.length > 0) {
      fetchJson<PlayerStatsheet[]>(
        `${BLASEBALL_ROOT}/database/playerStatsheets`,
        {
          ids: ids.join(","),
        }
      )
        .then((data) => {
          const group = data.reduce((rv: any, x: any) => {
            (rv[x.playerId] = rv[x.playerId] || []).push(x);
            return rv;
          }, {});
          let d = [];
          for (const key in group) {
            d.push(
              group[key].reduce((rv: PlayerStatsheet, x: PlayerStatsheet) => {
                const r: PlayerStatsheet = {
                  id: x.id,
                  playerId: x.playerId,
                  name: x.name,
                  team: x.team,
                  teamId: x.teamId,
                  atBats: x.atBats + (rv.atBats || 0),
                  caughtStealing: x.caughtStealing + (rv.caughtStealing || 0),
                  doubles: x.doubles + (rv.doubles || 0),
                  earnedRuns: x.earnedRuns + (rv.earnedRuns || 0),
                  groundIntoDp: x.groundIntoDp + (rv.groundIntoDp || 0),
                  hitBatters: x.hitBatters + (rv.hitBatters || 0),
                  hitByPitch: x.hitByPitch + (rv.hitByPitch || 0),
                  hits: x.hits + (rv.hits || 0),
                  hitsAllowed: x.hitsAllowed + (rv.hitsAllowed || 0),
                  homeRuns: x.homeRuns + (rv.homeRuns || 0),
                  losses: x.losses + (rv.losses || 0),
                  outsRecorded: x.outsRecorded + (rv.outsRecorded || 0),
                  pitchesThrown: x.pitchesThrown + (rv.pitchesThrown || 0),
                  quadruples: x.quadruples + (rv.quadruples || 0),
                  rbis: x.rbis + (rv.rbis || 0),
                  runs: x.runs + (rv.runs || 0),
                  stolenBases: x.stolenBases + (rv.stolenBases || 0),
                  strikeouts: x.strikeouts + (rv.strikeouts || 0),
                  struckouts: x.struckouts + (rv.struckouts || 0),
                  triples: x.triples + (rv.triples || 0),
                  walks: x.walks + (rv.walks || 0),
                  walksIssued: x.walksIssued + (rv.walksIssued || 0),
                  wins: x.wins + (rv.wins || 0),
                };
                return r;
              }, {})
            );
          }
          if (lineupOrder !== undefined) {
            d = d.sort((a, b) => (lineupOrder.get(a.playerId) ?? 0) > (lineupOrder.get(b.playerId) ?? 0) ? 1 : -1);
          }
          setPlayerStatsheets(d);
        })
        .catch((err) => setError(err));
    }
  }, [teamStatsheets, lineupOrder]);

  return {
    error,
    game: gameData,
    stats: {
      game: gameStatsheets,
      team: teamStatsheets,
      player: playerStatsheets,
    },
  };
}
