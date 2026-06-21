import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { BotClient } from "./types";
import { loadCommands } from "./handlers/commandHandler";
import { loadEvents } from "./handlers/eventHandler";
import { initI18n } from "./utils/i18n";

export async function createBot(): Promise<BotClient> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message],
  }) as BotClient;

  client.commands = new Collection();
  client.players = new Map();
  client.cooldowns = new Collection();

  await initI18n();
  await loadCommands(client);
  await loadEvents(client);

  return client;
}
