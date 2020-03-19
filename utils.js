const Words = require("./words.js");

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }

  return true;
};

const generateSecretCode = () => {
  const code = [];

  for (let i = 0; i < 3; i++) {
    let value;

    do {
      value = parseInt((Math.random() * 100) % 4) + 1;
    } while (code.includes(value));

    code.push(value);
  }

  return code;
};

const generateSecretWords = () => {
  const nbWords = Words.length;
  const wordIndexes = [];

  for (let i = 0; i < 8; i++) {
    let value;

    do {
      value = parseInt((Math.random() * 1000000) % nbWords);
    } while (wordIndexes.includes(value));

    wordIndexes.push(value);
  }

  return [
    [
      Words[wordIndexes[0]],
      Words[wordIndexes[2]],
      Words[wordIndexes[4]],
      Words[wordIndexes[6]]
    ],
    [
      Words[wordIndexes[1]],
      Words[wordIndexes[3]],
      Words[wordIndexes[5]],
      Words[wordIndexes[7]]
    ]
  ];
};

const getPlayersFromId = async (client, playerIds) =>
  await Promise.all(
    playerIds.map(async p => {
      let player;
      try {
        player = await client.users.fetch(p.substring(3, p.length - 1));
      } catch (e) {
        throw new Error(`Utilisateur ${p} invalide`);
      }

      return player;
    })
  );

const sendChannel = async (channel, content) => {
  await channel.send(content);
};

const sendDM = async (user, content) => {
  const dm = await user.createDM();
  dm.messages.channel.send(content);
  await user.deleteDM();
};

module.exports = {
  arraysEqual,
  generateSecretCode,
  generateSecretWords,
  getPlayersFromId,
  sendChannel,
  sendDM
};
