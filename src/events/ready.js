const { ActivityType, REST, Routes } = require("discord.js");

const name = "ready";
const once = true;

async function execute(client) {
  console.log(`✅ Bot aktif sebagai ${client.user?.tag}`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server`);

  await registerCommands(client);

  const activities = [
    { name: "/play untuk memutar musik", type: ActivityType.Listening },
    { name: `${client.guilds.cache.size} server`, type: ActivityType.Watching },
    { name: "Spotify 🎵", type: ActivityType.Listening },
  ];

  let i = 0;
  const setActivity = () => {
    const a = activities[i % activities.length];
    client.user?.setActivity(a.name, { type: a.type });
    i++;
  };

  setActivity();
  setInterval(setActivity, 30_000);
}

async function registerCommands(client) {
  try {
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    const clientId = process.env.DISCORD_CLIENT_ID;

    console.log(`📡 Mendaftarkan ${commands.length} slash commands ke Discord...`);

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log(`✅ ${commands.length} slash commands berhasil didaftarkan! (berlaku dalam ~1 menit)`);
  } catch (err) {
    console.error("❌ Gagal mendaftarkan commands:", err.message);
  }
}

module.exports = { name, once, execute };
