const Discord = require("discord.js");
const Utils = require("./utils");
const Game = require("./game.js");
const { clientKey } = require("./config");

const client = new Discord.Client();
let game;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async function(message) {
  if (message.content.substring(0, 1) == "!") {
    var args = message.content
      .substring(1)
      .replace(/\s+/g, " ")
      .trim()
      .split(" ");
    var cmd = args[0];
    var [main, cmd, ...opts] = args;

    if (main !== "decrypto" && main !== "d") {
      return;
    }

    switch (cmd) {
      case "aide":
      case "help": {
        Utils.sendChannel(
          message.channel,
          `Pour démarrer une partie:\n\t!decrypto start @Joueur1 @Joueur2\n`
        );

        break;
      }

      // Initialize the decrypto game
      case "start": {
        if (game) {
          let msg = "Une partie est déjà en cours\n";
          msg += "Pour la quitter\n\t";
          msg += `\`\`\`!decrypto abort\`\`\`\n`;

          await Utils.sendChannel(message.channel, msg);

          return;
        }

        const playerIds = [...opts];
        let players;

        try {
          players = await Utils.getPlayersFromId(client, playerIds);
        } catch (e) {
          Utils.sendChannel(message.channel, e.message);

          return;
        }

        game = new Game({
          client,
          channel: message.channel
        });

        try {
          await game.initialize({ players });
        } catch (e) {
          game = null;
        }
        break;
      }

      // Set indice
      case "indice": {
        if (!game) {
          Utils.sendChannel(
            message.channel,
            `Pour démarrer une partie:\n\t!decrypto start @Joueur1 @Joueur2\n`
          );

          return;
        }

        const player = message.author;
        const clues = [...opts];

        game.giveClue(player, clues);
        break;
      }

      // Make a guess
      case "decode": {
        if (!game) {
          Utils.sendChannel(
            message.channel,
            `Pour démarrer une partie:\n\t!decrypto start @Joueur1 @Joueur2\n`
          );

          return;
        }

        const player = message.author;
        const code = [...opts];

        const hasGameEnded = await game.makeGuess(player, code);

        if (hasGameEnded) {
          game = null;
        }
        break;
      }

      // Abort the current game
      case "abort": {
        game = null;

        Utils.sendChannel(message.channel, `La partie est annulé`);
        break;
      }

      default: {
        Utils.sendChannel(message.channel, `Commande inconnue`);
        break;
      }
    }
  }
});

client.login(clientKey);
