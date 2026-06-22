const { ActivityType } = require("discord.js");

const name = "ready";
const once = true;

async function execute(client) {
  console.log(`✅ Bot aktif sebagai ${client.user?.tag}`);
  console.log(`📡 Terhubung ke ${client.guilds.cache.size} server`);

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

module.exports = { name, once, execute };
