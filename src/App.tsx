import React from "react";
import { useGameData } from "./lib/game";
import Error from "./Error";

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

  const cols = [
    "atBats",
    "doubles",
    "earnedRuns",
    "hits",
    "hitsAllowed",
    "homeRuns",
    "pitchesThrown",
    "quadruples",
    "rbis",
    "runs",
    "stolenBases",
    "strikeouts",
    "triples",
    "walks",
    "walksIssued",
  ] as const;

  return (
    <div className="container mx-auto px-4">
      <p>
        Season {game.season + 1}, Day {game.day + 1}
        <br />
        {game.awayTeamNickname} at {game.homeTeamNickname}
      </p>
      <table>
        <tr>
          <td />
          {cols.map((col) => (
            <th>{col}</th>
          ))}
        </tr>
        {stats.player.map((sheet) => (
          <tr>
            <th>{sheet.name}</th>
            {cols.map((col) => (
              <td>{sheet[col]}</td>
            ))}
          </tr>
        ))}
      </table>
    </div>
  );
}

export default App;
