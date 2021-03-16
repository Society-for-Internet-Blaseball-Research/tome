import React, { useEffect, useState } from "react";
import { useGameData, fetchJson } from "./lib/game";
import Error from "./Error";
import { Game } from "./lib/data";
import { BLASEBALL_ROOT } from "./lib/env";

const StatCard = ({
  stats,
  cols,
  team,
}: {
  stats: any;
  cols: any;
  team?: string;
}) => (
  <table>
    <tr>
      <td />
      {cols.map((col: any) => (
        <th>{col[1]}</th>
      ))}
    </tr>
    {stats.player.map(
      (sheet: any) =>
        sheet[cols[0][0]] > 0 &&
        (!team || sheet.team === team) && (
          <tr>
            <th>{sheet.name}</th>
            {cols.map((col: any) => (
              <td>{sheet[col[0]]}</td>
            ))}
          </tr>
        )
    )}
  </table>
);

const BoxScore = ({ gameId }: { gameId: string | undefined }) => {
  if (gameId === undefined) {
    return <div>Select a game.</div>;
  }
  const { error, game, stats } = useGameData(gameId);
  if (error) {
    return <Error>{error.toString()}</Error>;
  }

  if (game === undefined || stats.player.length === 0) {
    return <div>loading...</div>;
  }

  const battingCols = [
    ["atBats", "AB"],
    ["runs", "R"],
    ["hits", "H"],
    ["doubles", "2B"],
    ["triples", "3B"],
    ["quadruples", "4B"],
    ["homeRuns", "HR"],
    ["stolenBases", "SB"],
    ["struckouts", "K"],
    ["walks", "BB"],
    ["rbis", "RBI"],
  ] as const;

  const pitchingCols = [
    ["pitchesThrown", "P"],
    ["hitsAllowed", "H"],
    ["strikeouts", "K"],
    ["walksIssued", "BB"],
    ["earnedRuns", "R"],
  ] as const;

  return (
    <div>
      <StatCard stats={stats} cols={battingCols} team={game.awayTeamName} />
      <StatCard stats={stats} cols={battingCols} team={game.homeTeamName} />
      <StatCard stats={stats} cols={pitchingCols} />
    </div>
  );
};

const GameSelector = () => {
  const [day, setDay] = useState<number | undefined>();
  const [season, setSeason] = useState<number | undefined>();
  const [gameId, setGameId] = useState<string | undefined>();

  const handleDay = (event: any) => {
    setDay(event.target.value - 1);
  };
  const handleSeason = (event: any) => {
    setSeason(event.target.value - 1);
  };
  const handleGameId = (event: any) => {
    setGameId(event.target.value);
  };

  const [games, setGames] = useState<Game[] | undefined>();
  useEffect(() => {
    if (!day || !season) {
      return;
    }
    fetchJson<Game[]>(
      `${BLASEBALL_ROOT}/database/games?season=${season}&day=${day}`
    ).then((data) => {
      setGames(data);
    });
  }, [day, season]);

  return (
    <div>
      <label htmlFor="season">Season</label>
      <input id="season" type="number" onChange={handleSeason} />
      <label htmlFor="day">Day</label>
      <input id="day" type="number" onChange={handleDay} />
      <select name="game" id="game" onChange={handleGameId}>
        <option value="none" selected disabled hidden>
          {games ? "Select a game" : "Enter a day"}
        </option>
        {games &&
          games.map((game: Game) => (
            <option value={game.id}>
              {game.awayTeamName} at {game.homeTeamName}
            </option>
          ))}
      </select>
      <BoxScore gameId={gameId} />
    </div>
  );
};

function App() {
  return (
    <div className="container mx-auto px-4">
      <GameSelector />
    </div>
  );
}

export default App;
