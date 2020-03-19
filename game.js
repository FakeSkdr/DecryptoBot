const Team = require("./team.js");
const Utils = require("./utils.js");

class Game {
  client;
  channel;
  teams = [];

  currentTurn = 0;
  currentPlayer = 0;
  currentTeam = {};
  currentClues = [];

  constructor({ client, channel }) {
    this.client = client;
    this.channel = channel;
  }

  async initialize({ players = [] }) {
    if (players.length < 4) {
      await Utils.sendChannel(
        this.channel,
        `4 joueurs minimum sont nécessaire pour jouer`
      );

      throw new Error("Pas assez de joueur");
    }

    this.teams = [new Team("Equipe 1"), new Team("Equipe 2")];

    const secretWords = Utils.generateSecretWords();

    this.teams.forEach((team, index) => {
      team.setSecretWords(secretWords[index]);
    });

    players.forEach(async (player, index) => {
      const nbEquipe = index < players.length / 2 ? 0 : 1;

      this.teams[nbEquipe].addPlayer(player);
      let message = `================================================\n`;
      message += `Nouvelle partie!\n`;
      message += `Les mots de ton équipe sont : \n\t${this.teams[
        nbEquipe
      ].secretWords.join(", ")}`;

      await Utils.sendDM(player, message);
    });

    await this.showTeams();

    await this.initNewTurn();
  }

  showGameStatus() {
    let message = `Nouveau tour de jeu\n\t`;
    message += `${this.currentTeam.name}, ${this.currentPlayer}:\n\t`;
    message += `A toi de faire deviner!\n\t`;
    message += `Tu vas recevoir le code en message privé\n\t`;
    message += `Pour donner les indices :`;
    message += `\`\`\`!decrypto indice Indice1 Indice2 Indice3\`\`\`\n`;

    message += `Les indices déjà données sont:\n\t`;

    for (let i = 1; i <= 4; i++) {
      message += `Mot ${i}: ${this.currentTeam.clues[i].join(", ")}\n\t`;
    }

    Utils.sendChannel(this.channel, message);
  }

  showTeams() {
    let message = `Les équipes sont:\n\t`;
    message += `Equipe 1 : ${this.teams[0].players.join(", ")}\n\t`;
    message += `Equipe 2 : ${this.teams[1].players.join(", ")}\n\t`;

    Utils.sendChannel(this.channel, message);
  }

  giveClue(player, clues) {
    if (player.id !== this.currentPlayer.id) {
      Utils.sendChannel(
        this.channel,
        `Ce n'est pas à toi de jouer <@!${player.id}>`
      );

      return;
    }

    if (!clues || clues.length !== 3) {
      Utils.sendChannel(
        this.channel,
        `Commande invalide, il faut donner exactement 3 indices`
      );

      return;
    }

    if (this.currentClues.length > 0) {
      Utils.sendChannel(this.channel, `Les indices ont déjà été donnés`);

      return;
    }

    this.currentClues = [...clues];

    clues.forEach((clue, i) => {
      const currentWordIndex = this.currentTeam.currentCode[i];

      if (currentWordIndex) {
        this.currentTeam.clues[currentWordIndex].push(clue);
      }
    });

    Utils.sendChannel(this.channel, `Les indices sont: ${clues.join(", ")}`);

    let message = `Vous pouvez vous concerter dans les salons vocaux\n`;
    message += `Pour valider votre réponse (Exemple): \n\t`;
    message += `\`\`\`!decrypto decode 4 2 3\`\`\`\n`;

    Utils.sendChannel(this.channel, message);
  }

  async makeGuess(player, code) {
    if (this.currentClues.length !== 3) {
      Utils.sendChannel(this.channel, `Attendez les indices avant de voter`);

      return;
    }

    if (!code || code.length !== 3) {
      Utils.sendChannel(
        this.channel,
        `Commande invalide, il faut donner exactement 3 chiffres`
      );

      return;
    }

    const team = this.teams.find(
      t => !!t.players.find(p => p.id === player.id)
    );

    if (team.currentGuess) {
      Utils.sendChannel(
        this.channel,
        `Une réponse à déjà été donné pour ${team.name}`
      );

      return;
    }

    team.setCurrentGuess(code.map(c => +c));

    const isWaitingTeam = !!this.teams.find(team => team.currentGuess === null);

    if (isWaitingTeam) {
      let message = `Réponse enregistré pour ${team.name}`;
      Utils.sendChannel(this.channel, message);

      return;
    }

    let message = `Les 2 équipes ont choisi\n`;

    this.teams.forEach(team => {
      message += `${team.name}: ${team.currentGuess.join(", ")}\n`;
    });

    message += `Le code correct était ${this.currentTeam.currentCode.join(
      ", "
    )}`;

    Utils.sendChannel(this.channel, message);

    this.teams.forEach(async team => {
      const isCodeValid = Utils.arraysEqual(
        team.currentGuess,
        this.currentTeam.currentCode
      );

      if (isCodeValid) {
        if (this.currentTeam !== team) {
          team.nbFoundOpponentCode++;
        }
      } else {
        if (this.currentTeam === team) {
          team.nbFailOwnCode++;
        }
      }
    });

    let resume = `Indices pour ${this.currentTeam.name}\n\t`;
    for (let i = 1; i <= 4; i++) {
      resume += `Mot ${i}: ${this.currentTeam.clues[i].join(", ")}\n\t`;
    }

    await Utils.sendChannel(this.channel, resume);

    if (this.hadGameEnded()) {
      this.showGameResult();
      return true;
    } else {
      this.startNextTurn();
    }
  }

  async initNewTurn() {
    const newCode = Utils.generateSecretCode();

    this.currentClues = [];
    this.currentTeam = this.teams[this.currentTurn % 2];
    this.currentTeam.setCurrentCode(newCode);
    this.currentPlayer = this.currentTeam.getActivePlayer();

    let message = `Tu dois faire deviner le code : ${newCode.join(", ")}`;

    await Utils.sendDM(this.currentPlayer, message);

    this.showGameStatus();
  }

  startNextTurn() {
    this.teams.forEach(t => t.endTurn());

    this.currentTeam.currentTeamTurn++;
    this.currentTurn++;

    this.initNewTurn();
  }

  hadGameEnded() {
    return (
      this.currentTurn % 2 === 1 &&
      !!this.teams.find(t => t.nbFailOwnCode > 1 || t.nbFoundOpponentCode > 1)
    );
  }

  showGameResult() {
    let message = "La partie est terminé \n\t";

    this.teams.forEach(team => {
      message += `${team.name} : \n\t\t`;
      message += `Nombre de code adverse trouvé ${team.nbFoundOpponentCode} : \n\t\t`;
      message += `Nombre d'erreur dans votre code ${team.nbFailOwnCode} : \n`;
      message += `\n\t`;
    });

    Utils.sendChannel(this.channel, message);
  }
}

module.exports = Game;
