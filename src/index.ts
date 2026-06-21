import "dotenv/config";
import { createBot } from "./bot";

const requiredEnv = ["DISCORD_TOKEN", "DISCORD_CLIENT_ID"];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
  console.error("📄 Copy .env.example to .env and fill in the values");
  process.exit(1);
}

async function main() {
  console.log("🎵 Starting Discord Music Bot...");

  try {
    const client = await createBot();

    client.login(process.env.DISCORD_TOKEN).catch((err) => {
      console.error("❌ Failed to login:", err.message);
      process.exit(1);
    });

    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down gracefully...");
      const { playerManager } = await import("./music/PlayerManager");
      playerManager.destroyAll();
      client.destroy();
      process.exit(0);
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled promise rejection:", error);
    });
  } catch (error) {
    console.error("❌ Failed to start bot:", error);
    process.exit(1);
  }
}

main();
