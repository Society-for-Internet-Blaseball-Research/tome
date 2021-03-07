/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from "react";
import { BLASEBALL_ROOT } from "./env";
import { Game, GameStatsheet, TeamStatsheet, PlayerStatsheet } from "./data";

interface GameDataHookReturn {
  error: any;
  game: Game | undefined;
  stats: {
    game: GameStatsheet[];
    team: TeamStatsheet[];
    player: PlayerStatsheet[];
  };
}

async function fetchJson<T>(
  url: string,
  query?: { [key: string]: string }
): Promise<T> {
  const qs =
    query === undefined ? "" : `?${new URLSearchParams(query).toString()}`;
  return fetch(`${url}${qs}`).then((res) => res.json());
}

export function useGameData(id: string): GameDataHookReturn {
  const [error, setError] = useState<any>();

  // game data
  const [gameData, setGame] = useState<Game | undefined>();
  let stream: EventSource | undefined;
  useEffect(() => {
    fetchJson<Game>(`${BLASEBALL_ROOT}/database/gameById/${id}`)
      // eslint-disable-next-line consistent-return
      .then((data) => {
        setGame(data);

        // fetch game updates from streamData
        if (stream !== undefined) {
          if (data.gameComplete) {
            stream.close();
            stream = undefined;
          } else {
            stream = new EventSource(`${BLASEBALL_ROOT}/events/streamData`);
            stream.addEventListener("open", () => {
              console.log(`listening for game updates (id=${id})`); // eslint-disable-line no-console
            });
            stream.addEventListener("message", (event) => {
              const g = JSON.parse(event.data).value?.games?.find(
                (game: Game) => game.id === id
              );
              if (g) {
                setGame(g);
              }
            });
            stream.addEventListener("error", (err) => {
              setError(err);
            });
            return () => {
              stream?.close();
            };
          }
        }
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
  }, [gameStatsheets, ...updateStatsOn]);

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
        .then((data) => setPlayerStatsheets(data))
        .catch((err) => setError(err));
    }
  }, [teamStatsheets, ...updateStatsOn]);

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
