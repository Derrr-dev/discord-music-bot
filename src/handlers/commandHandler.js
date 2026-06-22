const { Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");

async function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = join(__dirname, "..", "commands");
  const categories = readdirSync(commandsPath);
  let count = 0;

  for (const category of categories) {
    const files = readdirSync(join(commandsPath, category)).filter(f => f.endsWith(".js"));
    for (const file of files) {
      try {
        const mod = require(join(commandsPath, category, file));
        const command = mod.command;
        if (!command?.data?.name || !command?.execute) {
          console.warn(`⚠️ Skipping invalid: ${file}`);
          continue;
        }
        client.commands.set(command.data.name, command);
        count++;
      } catch (err) {
        console.error(`❌ Error loading ${file}:`, err.message);
      }
    }
  }
  console.log(`✅ Loaded ${count} commands`);
}

module.exports = { loadCommands };
