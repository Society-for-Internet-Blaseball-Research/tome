import React, { useEffect, useState } from "react";
import { useGameData, fetchJson } from "./lib/game";
import Error from "./Error";
import { Game } from "./lib/data";
import { BLASEBALL_ROOT } from "./lib/env";

function emoji(e:string) {
  const n = Number(e);
  return Number.isNaN(n) ? e : String.fromCodePoint(n);
}

const StatCard = ({
  stats,
  cols,
  team,
  batter,
}: {
  stats: any;
  cols: any;
  team?: string;
  batter?: string;
}) => {
  return (<div className="statCard">
    {team && <div>{team}</div>}
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
            <tr className="statRow">
              <th className="playerName">{batter === sheet.name ? emoji('127951') : ''} {sheet.name}</th>
              {cols.map((col: any) => (
                <td className="statCell">{sheet[col[0]]}</td>
              ))}
            </tr>
          )
      )}
    </table>
  </div>);
};

const BoxScore = ({ gameId }: { gameId: string | undefined }) => {
  if (!gameId) {
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
      <StatCard stats={stats} cols={battingCols} team={game.awayTeamName} batter={game.awayBatterName} />
      <StatCard stats={stats} cols={battingCols} team={game.homeTeamName} batter={game.homeBatterName} />
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
    setGameId(undefined);
  };
  const handleSeason = (event: any) => {
    setSeason(event.target.value - 1);
    setGameId(undefined);
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
    <div className="gameSelector">
      <label htmlFor="season" className="gameSelectorLabel">Season</label>
      <input id="season" type="number" onChange={handleSeason} className="gameSelectorInput"/>
      <label htmlFor="day" className="gameSelectorLabel">Day</label>
      <input id="day" type="number" onChange={handleDay} className="gameSelectorInput"/>
      <select name="game" id="game" onChange={handleGameId} value={gameId}>
        <option value={undefined} selected disabled hidden>
          {games ? "Select a game" : "Enter a day"}
        </option>
        {games &&
          games.map((game: Game) => (
            <option value={game.id}>
              {emoji(game.awayTeamEmoji)} {game.awayTeamNickname} at {emoji(game.homeTeamEmoji)} {game.homeTeamNickname}
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
