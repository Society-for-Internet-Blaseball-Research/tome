import React, { useEffect, useState, useCallback } from "react";
import { useGameData, fetchJson } from "./lib/game";
import Error from "./Error";
import { Game, SimulationData, SeasonDayCount } from "./lib/data";
import { BLASEBALL_ROOT } from "./lib/env";

function emoji(e:string) {
  const n = Number(e);
  return Number.isNaN(n) ? e : String.fromCodePoint(n);
}

function debounce(func: any, wait: number) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    const later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

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
            <tr id={sheet.playerId} className="statRow">
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
  if (!gameId || gameId === "0") {
    return <div>Select a game.</div>;
  }
  const { error, game, stats } = useGameData(gameId);
  if (error) {
    return <Error>{error.toString()}</Error>;
  }

  if (game === undefined) {
    return <div>loading statsheets...</div>;
  }

  if (stats.player.length === 0) {
    if (game.gameComplete) {
      return <div>loading statsheets...</div>;
    }
    else {
      return <div>waiting for game to start...</div>;
    }
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

const SeasonSelector = ({curSeason, onChange, name}: {curSeason: number, onChange: any, name: string}) => {
  let seasonOptions = [];
  for (let i = curSeason; i >= 0; i--) {
    seasonOptions.push(
      <option value={i} key={i}>{i + 1}</option>
    );
  }
  return (
    <select name={name} onChange={onChange} class="gameSelectorInput">
      <option value="-1" selected disabled hidden>{curSeason === -1 ? "loading" : name}</option>
      {seasonOptions}
    </select>
  );
}

const GameSelector = (props: any) => {
  const [day, setDay] = useState<number | undefined>();
  const [season, setSeason] = useState<number | undefined>();
  const [gameId, setGameId] = useState<string | undefined>();
  const [maxSeason, setMaxSeason] = useState<number | undefined>();
  const [maxDay, setMaxDay] = useState<number | undefined>();

  const handleDay = (event: any) => {
    console.log(event.target.value);
    setDay(event.target.value);
    setGameId("0");
  };
  const handleSeason = (event: any) => {
    setSeason(event.target.value);
    setGameId("0");

    setMaxDay(-1);
    fetchJson<SeasonDayCount>(
      `${BLASEBALL_ROOT}/database/seasondaycount?season=${event.target.value}`
    ).then((data) => {
      setMaxDay(data.dayCount + 1);
    });
  };
  const handleGameId = (event: any) => {
    setGameId(event.target.value);
  };

  const [games, setGames] = useState<Game[] | undefined>();
  useEffect(debounce(() => {
    if (!day || !season) {
      return;
    }
    setGames([]);
    fetchJson<Game[]>(
      `${BLASEBALL_ROOT}/database/games?season=${season}&day=${day}`
    ).then((data) => {
      setGames(data);
    });
  }, 500), [day, season]);

  useEffect(() => {
    // load current day
    fetchJson<SimulationData>(
      `${BLASEBALL_ROOT}/database/simulationData`
    ).then((data) => {
      if (!season) {
        setMaxSeason(data.season);
      }
      if (!day) {
        setMaxDay(data.day);
      }
    });
  }, []);

  return (
    <div className="gameSelector">
      <label htmlFor="Season" className="gameSelectorLabel">Season</label>
      <SeasonSelector curSeason={maxSeason} onChange={handleSeason} name="Season"/>
      <label htmlFor="Day" className="gameSelectorLabel">Day</label>
      <SeasonSelector curSeason={maxDay} onChange={handleDay} name="Day"/>
      <select name="game" id="game" onChange={handleGameId} value={gameId}>
        <option value="0" selected disabled hidden>
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
