const { MusicPlayer } = require("./MusicPlayer");
const { db } = require("../database/Database");

class PlayerManager {
  constructor() {
    this.players = new Map();
  }

  get(guildId) { return this.players.get(guildId); }

  async create(guildId, voiceChannel, textChannel) {
    const existing = this.players.get(guildId);
    if (existing && !existing.isDestroyed()) return existing;
    const settings = db.getGuildSettings(guildId);
    const player = new MusicPlayer(guildId, voiceChannel, textChannel, settings.defaultVolume);
    await player.connect();
    this.players.set(guildId, player);
    return player;
  }

  destroy(guildId) {
    const player = this.players.get(guildId);
    if (player) { player.destroy(); this.players.delete(guildId); }
  }

  has(guildId) {
    const p = this.players.get(guildId);
    return !!p && !p.isDestroyed();
  }

  destroyAll() {
    for (const [, player] of this.players) player.destroy();
    this.players.clear();
  }
}

const playerManager = new PlayerManager();
module.exports = { playerManager, PlayerManager };
