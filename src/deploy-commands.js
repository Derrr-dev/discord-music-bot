require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");

async function deploy() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!token || !clientId) {
    console.error("❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID");
    process.exit(1);
  }

  const commands = [];
  const commandsPath = join(__dirname, "commands");
  for (const category of readdirSync(commandsPath)) {
    for (const file of readdirSync(join(commandsPath, category)).filter(f => f.endsWith(".js"))) {
      try {
        const mod = require(join(commandsPath, category, file));
        if (mod.command?.data) {
          commands.push(mod.command.data.toJSON());
          console.log(`✅ Loaded: /${mod.command.data.name}`);
        }
      } catch (err) { console.error(`❌ ${file}:`, err.message); }
    }
  }

  const rest = new REST().setToken(token);
  console.log(`\n📡 Deploying ${commands.length} slash commands...`);

  const guildId = process.env.GUILD_ID;
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ Deployed to guild ${guildId} (instant)`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅ Deployed globally (up to 1 hour delay)");
  }
}

deploy().catch(err => { console.error("❌ Deploy failed:", err); process.exit(1); });
