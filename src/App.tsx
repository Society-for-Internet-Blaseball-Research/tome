import React, { useEffect, useState } from "react";
import { HashRouter, Switch, Route, useHistory } from "react-router-dom";
import { useGameData, fetchJson } from "./lib/game";
import Error from "./Error";
import { Game, SimulationData, SeasonDayCount } from "./lib/data";
import { BLASEBALL_ROOT } from "./lib/env";
import { current, toggle } from "./lib/color-scheme";

function emoji(e: string) {
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
}) => (
  <div className="statCard">
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
              <th className="playerName">
                {batter === sheet.name ? emoji("127951") : ""} {sheet.name}
              </th>
              {cols.map((col: any) => (
                <td className="statCell">{sheet[col[0]]}</td>
              ))}
            </tr>
          )
      )}
    </table>
  </div>
);

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
    return <div>waiting for game to start...</div>;
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
      <StatCard
        stats={stats}
        cols={battingCols}
        team={game.awayTeamName}
        batter={game.awayBatterName}
      />
      <StatCard
        stats={stats}
        cols={battingCols}
        team={game.homeTeamName}
        batter={game.homeBatterName}
      />
      <StatCard stats={stats} cols={pitchingCols} />
    </div>
  );
};

const SeasonSelector = ({
  curSeason,
  onChange,
  name,
  value,
}: {
  curSeason: number;
  onChange: any;
  name: string;
  value: number | undefined;
}) => {
  const seasonOptions = [];
  for (let i = curSeason; i >= 0; i--) {
    seasonOptions.push(
      <option value={i} key={i}>
        {i + 1}
      </option>
    );
  }
  return (
    <select
      name={name}
      onChange={onChange}
      className="gameSelectorInput"
      value={value || -1}
    >
      <option value="-1" selected disabled hidden>
        {curSeason === -1 ? "loading" : name}
      </option>
      {seasonOptions}
    </select>
  );
};

const DisplayModeButton = () => {
  const [value, setValue] = useState<string>(current() === "light" ? "🌚" : "🌞");
  const handleClick = (event: any) => {
    toggle();
    setValue(current() === "light" ? "🌚" : "🌞");
  };
  return <input type="button" onClick={handleClick} value={value} className="displayModeButton"/>
};

const GameSelector = (props: any) => {
  const history = useHistory();
  const [day, setDay] = useState<number | undefined>();
  const [season, setSeason] = useState<number | undefined>();
  const [gameId, setGameId] = useState<string | undefined>();
  const [maxSeason, setMaxSeason] = useState<number>(-1);
  const [maxDay, setMaxDay] = useState<number>(-1);

  const handleDay = (event: any) => {
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
    history.push(`/${event.target.value}`);
  };

  const [games, setGames] = useState<Game[] | undefined>();
  useEffect(() => {
    if (!day || !season) {
      return;
    }
    setGames([]);
    fetchJson<Game[]>(
      `${BLASEBALL_ROOT}/database/games?season=${season}&day=${day}`
    ).then((data) => {
      setGames(data);
    });
  }, [day, season]);

  useEffect(() => {
    // load current day
    fetchJson<SimulationData>(`${BLASEBALL_ROOT}/database/simulationData`)
      .then((data) => {
        setMaxSeason(data.season);
        setMaxDay(data.day);
      })
      .then(() => {
        if (props.match?.params.gameid) {
          return fetchJson<Game>(
            `${BLASEBALL_ROOT}/database/gameById/${props.match.params.gameid}`
          );
        }
        return null;
      })
      .then((data) => {
        if (!data) {
          return;
        }
        setDay(data.day);
        setSeason(data.season);
        setGameId(data.id);
      });
  }, []);

  return (
    <div className="gameSelector">
      <label htmlFor="Season" className="gameSelectorLabel">
        Season
      </label>
      <SeasonSelector
        curSeason={maxSeason}
        onChange={handleSeason}
        name="Season"
        value={season}
      />
      <label htmlFor="Day" className="gameSelectorLabel">
        Day
      </label>
      <SeasonSelector
        curSeason={maxDay}
        onChange={handleDay}
        name="Day"
        value={day}
      />
      <select name="game" id="game" onChange={handleGameId} value={gameId}>
        <option value="0" selected disabled hidden>
          {games ? "Select a game" : "Enter a day"}
        </option>
        {games &&
          games.map((game: Game) => (
            <option value={game.id}>
              {emoji(game.awayTeamEmoji)} {game.awayTeamNickname} at{" "}
              {emoji(game.homeTeamEmoji)} {game.homeTeamNickname}
            </option>
          ))}
      </select>
      <BoxScore gameId={gameId} />
      <DisplayModeButton />
    </div>
  );
};

function App() {
  return (
    <HashRouter>
      <div className="container mx-auto px-4">
        <Switch>
          <Route path="/:gameid" component={GameSelector} />
          <Route path="/">
            <GameSelector />
          </Route>
        </Switch>
      </div>
    </HashRouter>
  );
}

export default App;
