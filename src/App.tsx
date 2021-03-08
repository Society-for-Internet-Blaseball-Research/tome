import React from "react";
import { useGameData } from "./lib/game";
import Error from "./Error";

function StatCard({ stats, cols, team }) {
  console.log(stats.player[0]);
  return (
    <table>
      <tr>
        <td />
        {cols.map((col) => (
          <th>{col[1]}</th>
        ))}
      </tr>
      {stats.player.map(
        (sheet) => (
          sheet[cols[0][0]] > 0 && (!team || sheet.team === team) && (
            <tr>
              <th>{sheet.name}</th>
              {cols.map((col) => (
                <td>{sheet[col[0]]}</td>
              ))}
            </tr>
          )
        ))}
    </table>
  );
}

function App() {
  const { error, game, stats } = useGameData(
    // TODO routing
    "892c0a7a-cdf2-47cd-bac7-c5dc51ffca5d"
  );
  if (error) {
    return <Error>{error.toString()}</Error>;
  }
  if (game === undefined || stats.player.length === 0) {
    return <div className="container mx-auto px-4">loading...</div>;
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
    <div className="container mx-auto px-4">
      <p>
        Season {game.season + 1}, Day {game.day + 1}
        <br />
        {game.awayTeamNickname} at {game.homeTeamNickname}
      </p>
      <StatCard stats={stats} cols={battingCols} team={game.awayTeamName}/>
      <StatCard stats={stats} cols={battingCols} team={game.homeTeamName}/>
      <StatCard stats={stats} cols={pitchingCols} />
    </div>
  );
}

export default App;
