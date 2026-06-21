import { Client, ActivityType } from "discord.js";
import { BotClient } from "../types";

export const name = "ready";
export const once = true;

export async function execute(client: BotClient) {
  console.log(`✅ Bot aktif sebagai ${client.user?.tag}`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server`);

  const activities = [
    { name: "/play untuk memutar musik", type: ActivityType.Listening },
    { name: `${client.guilds.cache.size} server`, type: ActivityType.Watching },
    { name: "Spotify 🎵", type: ActivityType.Listening },
  ];

  let i = 0;
  const setActivity = () => {
    const activity = activities[i % activities.length];
    client.user?.setActivity(activity.name, { type: activity.type });
    i++;
  };

  setActivity();
  setInterval(setActivity, 30_000);
}
