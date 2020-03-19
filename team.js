class Team {
  name;
  players = [];
  secretWords = [];
  currentTeamTurn = 0;

  currentCode = null;
  currentGuess = null;

  codeHistory = [];

  nbFailOwnCode = 0;
  nbFoundOpponentCode = 0;

  clues = {
    1: [],
    2: [],
    3: [],
    4: []
  };

  constructor(name) {
    this.name = name;
  }

  addPlayer(player) {
    this.players.push(player);
  }

  setCurrentCode(code) {
    if (this.currentCode) {
      this.codeHistory.push(this.currentCode);
    }

    this.currentCode = code;
  }

  setSecretWords(words) {
    this.secretWords.push(...words);
  }

  setCurrentGuess(guess) {
    this.currentGuess = guess;
  }

  getActivePlayer() {
    return this.players[this.currentTeamTurn % this.players.length];
  }

  endTurn() {
    this.currentGuess = null;
    this.currentCode = null;
  }
}

module.exports = Team;
