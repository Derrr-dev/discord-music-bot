import { TextChannel, VoiceChannel } from "discord.js";
import { MusicPlayer } from "./MusicPlayer";
import { db } from "../database/Database";

class PlayerManager {
  private players: Map<string, MusicPlayer> = new Map();

  get(guildId: string): MusicPlayer | undefined {
    return this.players.get(guildId);
  }

  async create(
    guildId: string,
    voiceChannel: VoiceChannel,
    textChannel: TextChannel
  ): Promise<MusicPlayer> {
    const existing = this.players.get(guildId);
    if (existing && !existing.isDestroyed()) return existing;

    const settings = db.getGuildSettings(guildId);
    const player = new MusicPlayer(
      guildId,
      voiceChannel,
      textChannel,
      settings.defaultVolume
    );
    await player.connect();
    this.players.set(guildId, player);
    return player;
  }

  destroy(guildId: string): void {
    const player = this.players.get(guildId);
    if (player) {
      player.destroy();
      this.players.delete(guildId);
    }
  }

  has(guildId: string): boolean {
    const player = this.players.get(guildId);
    return !!player && !player.isDestroyed();
  }

  cleanup(guildId: string): void {
    const player = this.players.get(guildId);
    if (player?.isDestroyed()) {
      this.players.delete(guildId);
    }
  }

  destroyAll(): void {
    for (const [, player] of this.players) {
      player.destroy();
    }
    this.players.clear();
  }
}

export const playerManager = new PlayerManager();
