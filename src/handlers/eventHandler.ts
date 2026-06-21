import { readdirSync } from "fs";
import { join } from "path";
import { BotClient } from "../types";

export async function loadEvents(client: BotClient): Promise<void> {
  const eventsPath = join(__dirname, "..", "events");
  const eventFiles = readdirSync(eventsPath).filter(
    (f) => f.endsWith(".ts") || f.endsWith(".js")
  );

  let count = 0;

  for (const file of eventFiles) {
    try {
      const filePath = join(eventsPath, file);
      const event = await import(filePath);

      const listener = (...args: any[]) => event.execute(...args, client);

      if (event.once) {
        client.once(event.name, listener);
      } else {
        client.on(event.name, listener);
      }

      count++;
    } catch (error) {
      console.error(`❌ Error loading event ${file}:`, error);
    }
  }

  console.log(`✅ Loaded ${count} events`);
}
