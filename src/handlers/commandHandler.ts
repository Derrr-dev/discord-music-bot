import { Collection } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { BotClient, Command } from "../types";

export async function loadCommands(client: BotClient): Promise<void> {
  client.commands = new Collection<string, Command>();

  const commandsPath = join(__dirname, "..", "commands");
  const categories = readdirSync(commandsPath);

  let count = 0;

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const commandFiles = readdirSync(categoryPath).filter(
      (f) => f.endsWith(".ts") || f.endsWith(".js")
    );

    for (const file of commandFiles) {
      try {
        const filePath = join(categoryPath, file);
        const module = await import(filePath);
        const command: Command = module.command;

        if (!command || !command.data || !command.execute) {
          console.warn(`⚠️ Skipping invalid command file: ${file}`);
          continue;
        }

        client.commands.set(command.data.name, command);
        count++;
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error);
      }
    }
  }

  console.log(`✅ Loaded ${count} commands`);
}
