import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

async function deployCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error("❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID");
    process.exit(1);
  }

  const commands: any[] = [];
  const commandsPath = join(__dirname, "commands");
  const categories = readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const files = readdirSync(categoryPath).filter(
      (f) => f.endsWith(".ts") || f.endsWith(".js")
    );

    for (const file of files) {
      try {
        const module = await import(join(categoryPath, file));
        if (module.command?.data) {
          commands.push(module.command.data.toJSON());
          console.log(`✅ Loaded: /${module.command.data.name}`);
        }
      } catch (error) {
        console.error(`❌ Error loading ${file}:`, error);
      }
    }
  }

  const rest = new REST().setToken(token);

  console.log(`\n📡 Deploying ${commands.length} slash commands...`);

  try {
    const guildId = process.env.GUILD_ID;

    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`✅ Commands deployed to guild ${guildId} (instant update)`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("✅ Commands deployed globally (may take up to 1 hour)");
    }
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
    process.exit(1);
  }
}

deployCommands();
