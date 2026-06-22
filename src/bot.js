const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const { loadCommands } = require("./handlers/commandHandler");
const { loadEvents } = require("./handlers/eventHandler");
const { initI18n } = require("./utils/i18n");

async function createBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.commands = new Collection();
  client.players = new Map();
  client.cooldowns = new Collection();

  await initI18n();
  await loadCommands(client);
  await loadEvents(client);

  return client;
}

module.exports = { createBot };
