require("dotenv").config();
const { createBot } = require("./bot");

const required = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID"];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌ Missing env vars: ${missing.join(", ")}`);
  console.error("📄 Copy .env.example to .env and fill in the values");
  process.exit(1);
}

async function main() {
  console.log("🎵 Starting Discord Music Bot...");
  try {
    const client = await createBot();
    await client.login(process.env.DISCORD_TOKEN);

    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down...");
      const { playerManager } = require("./music/PlayerManager");
      playerManager.destroyAll();
      client.destroy();
      process.exit(0);
    });

    process.on("unhandledRejection", err => console.error("Unhandled rejection:", err));
  } catch (err) {
    console.error("❌ Failed to start:", err);
    process.exit(1);
  }
}

main();
