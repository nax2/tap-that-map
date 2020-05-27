import React, { Component } from "react";
import { database } from "../firebaseInitialise";
import { Paper, Typography } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/core/styles";
import theme from "../resources/theme.jsx";

class Leaderboard extends Component {
  state = {
    leaderArray: null,
  };

  retrieveLeaderboard = () => {
    const scores = database.ref("scores");
    scores
      .orderByChild("score")
      .limitToLast(5)
      .once("value")
      .then((data) => {
        const scoreObjects = data.val();
        const arrayOfScoresAndNames = Object.values(scoreObjects).map(
          ({ score, username }) => {
            return { score, username };
          }
        );
        arrayOfScoresAndNames.sort((a, b) => b.score - a.score);
        this.setState({ leaderArray: arrayOfScoresAndNames });
      });
  };

  componentDidMount() {
    this.retrieveLeaderboard();
  }

  render() {
    const { leaderArray } = this.state;
    return (
      <ThemeProvider theme={theme}>
        <Paper id="leaderboard-wrapper">
          <Typography variant="h3">LeaderBoard</Typography>
          {leaderArray
            ? leaderArray.map((result, index) => {
                return (
                  <Typography variant="h2" key={`${result}${index}`}>
                    {index + 1}: {`${result.score} (${result.username})`}
                  </Typography>
                );
              })
            : null}
        </Paper>
      </ThemeProvider>
    );
  }
}

export default Leaderboard;
