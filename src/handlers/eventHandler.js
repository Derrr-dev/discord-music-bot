const { readdirSync } = require("fs");
const { join } = require("path");

async function loadEvents(client) {
  const eventsPath = join(__dirname, "..", "events");
  const files = readdirSync(eventsPath).filter(f => f.endsWith(".js"));
  let count = 0;

  for (const file of files) {
    try {
      const event = require(join(eventsPath, file));
      const listener = (...args) => event.execute(...args, client);
      event.once ? client.once(event.name, listener) : client.on(event.name, listener);
      count++;
    } catch (err) {
      console.error(`❌ Error loading event ${file}:`, err.message);
    }
  }
  console.log(`✅ Loaded ${count} events`);
}

module.exports = { loadEvents };
