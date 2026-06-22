const { ActivityType, REST, Routes } = require("discord.js");

const name = "ready";
const once = true;

async function execute(client) {
  console.log(`✅ Bot aktif sebagai ${client.user?.tag}`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server`);

  await registerCommands(client);
  setStatus(client);
}

async function registerCommands(client) {
  try {
    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!token || !clientId) {
      console.error("❌ DISCORD_TOKEN atau DISCORD_CLIENT_ID tidak ditemukan");
      return;
    }

    const commands = [...client.commands.values()].map(cmd => cmd.data.toJSON());
    console.log(`📡 Mendaftarkan ${commands.length} slash commands...`);

    const rest = new REST({ version: "10" }).setToken(token);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log(`✅ ${commands.length} slash commands terdaftar! (aktif dalam ~1 menit)`);
  } catch (err) {
    console.error("❌ Gagal daftarkan commands:", err.message);
  }
}

function setStatus(client) {
  const activities = [
    { name: "/play untuk memutar musik", type: ActivityType.Listening },
    { name: `${client.guilds.cache.size} server`, type: ActivityType.Watching },
    { name: "Spotify 🎵", type: ActivityType.Listening },
  ];
  let i = 0;
  const update = () => {
    const a = activities[i++ % activities.length];
    client.user?.setActivity(a.name, { type: a.type });
  };
  update();
  setInterval(update, 30_000);
}

module.exports = { name, once, execute };
