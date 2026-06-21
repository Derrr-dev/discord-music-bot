import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { GuildSettings, UserData, Playlist } from "../types";

const DB_PATH = process.env.DB_PATH || "./data/bot.db";

export class BotDatabase {
  private db: Database.Database;

  constructor() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(DB_PATH);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS guild_settings (
        guild_id TEXT PRIMARY KEY,
        language TEXT DEFAULT 'id',
        dj_role_id TEXT,
        default_volume INTEGER DEFAULT 50,
        max_queue_size INTEGER DEFAULT 200,
        announce_songs INTEGER DEFAULT 1,
        prefix TEXT DEFAULT '!'
      );

      CREATE TABLE IF NOT EXISTS user_data (
        user_id TEXT,
        guild_id TEXT,
        favorites TEXT DEFAULT '[]',
        history TEXT DEFAULT '[]',
        PRIMARY KEY (user_id, guild_id)
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        tracks TEXT DEFAULT '[]',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  getGuildSettings(guildId: string): GuildSettings {
    let row = this.db
      .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
      .get(guildId) as any;

    if (!row) {
      this.db
        .prepare(
          "INSERT INTO guild_settings (guild_id) VALUES (?)"
        )
        .run(guildId);
      row = this.db
        .prepare("SELECT * FROM guild_settings WHERE guild_id = ?")
        .get(guildId) as any;
    }

    return {
      guildId: row.guild_id,
      language: row.language,
      djRoleId: row.dj_role_id,
      defaultVolume: row.default_volume,
      maxQueueSize: row.max_queue_size,
      announceSongs: row.announce_songs === 1,
      prefix: row.prefix,
    };
  }

  updateGuildSettings(guildId: string, settings: Partial<GuildSettings>) {
    const current = this.getGuildSettings(guildId);
    const merged = { ...current, ...settings };
    this.db
      .prepare(
        `UPDATE guild_settings SET
          language = ?,
          dj_role_id = ?,
          default_volume = ?,
          max_queue_size = ?,
          announce_songs = ?,
          prefix = ?
        WHERE guild_id = ?`
      )
      .run(
        merged.language,
        merged.djRoleId,
        merged.defaultVolume,
        merged.maxQueueSize,
        merged.announceSongs ? 1 : 0,
        merged.prefix,
        guildId
      );
  }

  getUserData(userId: string, guildId: string): UserData {
    let row = this.db
      .prepare(
        "SELECT * FROM user_data WHERE user_id = ? AND guild_id = ?"
      )
      .get(userId, guildId) as any;

    if (!row) {
      this.db
        .prepare(
          "INSERT INTO user_data (user_id, guild_id) VALUES (?, ?)"
        )
        .run(userId, guildId);
      row = this.db
        .prepare(
          "SELECT * FROM user_data WHERE user_id = ? AND guild_id = ?"
        )
        .get(userId, guildId) as any;
    }

    return {
      userId: row.user_id,
      guildId: row.guild_id,
      favorites: row.favorites,
      history: row.history,
      playlists: "[]",
    };
  }

  addFavorite(userId: string, guildId: string, track: object): boolean {
    const data = this.getUserData(userId, guildId);
    const favorites = JSON.parse(data.favorites) as any[];
    if (favorites.some((f: any) => f.url === (track as any).url)) return false;
    favorites.unshift(track);
    if (favorites.length > 100) favorites.pop();
    this.db
      .prepare(
        "UPDATE user_data SET favorites = ? WHERE user_id = ? AND guild_id = ?"
      )
      .run(JSON.stringify(favorites), userId, guildId);
    return true;
  }

  removeFavorite(userId: string, guildId: string, url: string): boolean {
    const data = this.getUserData(userId, guildId);
    const favorites = JSON.parse(data.favorites) as any[];
    const idx = favorites.findIndex((f: any) => f.url === url);
    if (idx === -1) return false;
    favorites.splice(idx, 1);
    this.db
      .prepare(
        "UPDATE user_data SET favorites = ? WHERE user_id = ? AND guild_id = ?"
      )
      .run(JSON.stringify(favorites), userId, guildId);
    return true;
  }

  getFavorites(userId: string, guildId: string): any[] {
    const data = this.getUserData(userId, guildId);
    return JSON.parse(data.favorites);
  }

  addHistory(userId: string, guildId: string, track: object) {
    const data = this.getUserData(userId, guildId);
    const history = JSON.parse(data.history) as any[];
    history.unshift({ ...track, playedAt: Date.now() });
    if (history.length > 50) history.pop();
    this.db
      .prepare(
        "UPDATE user_data SET history = ? WHERE user_id = ? AND guild_id = ?"
      )
      .run(JSON.stringify(history), userId, guildId);
  }

  getHistory(userId: string, guildId: string): any[] {
    const data = this.getUserData(userId, guildId);
    return JSON.parse(data.history);
  }

  clearHistory(userId: string, guildId: string) {
    this.db
      .prepare(
        "UPDATE user_data SET history = '[]' WHERE user_id = ? AND guild_id = ?"
      )
      .run(userId, guildId);
  }

  createPlaylist(
    userId: string,
    guildId: string,
    name: string
  ): Playlist | null {
    const existing = this.db
      .prepare(
        "SELECT id FROM playlists WHERE user_id = ? AND guild_id = ? AND name = ?"
      )
      .get(userId, guildId, name);
    if (existing) return null;

    const id = `${userId}-${Date.now()}`;
    const now = Date.now();
    this.db
      .prepare(
        `INSERT INTO playlists (id, name, user_id, guild_id, tracks, created_at, updated_at)
         VALUES (?, ?, ?, ?, '[]', ?, ?)`
      )
      .run(id, name, userId, guildId, now, now);

    return {
      id,
      name,
      userId,
      guildId,
      tracks: "[]",
      createdAt: now,
      updatedAt: now,
    };
  }

  getPlaylists(userId: string, guildId: string): Playlist[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM playlists WHERE user_id = ? AND guild_id = ?"
      )
      .all(userId, guildId) as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      userId: r.user_id,
      guildId: r.guild_id,
      tracks: r.tracks,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  getPlaylist(userId: string, guildId: string, name: string): Playlist | null {
    const row = this.db
      .prepare(
        "SELECT * FROM playlists WHERE user_id = ? AND guild_id = ? AND name = ?"
      )
      .get(userId, guildId, name) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      userId: row.user_id,
      guildId: row.guild_id,
      tracks: row.tracks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  addToPlaylist(
    userId: string,
    guildId: string,
    playlistName: string,
    track: object,
    maxSize: number
  ): { success: boolean; reason?: string } {
    const playlist = this.getPlaylist(userId, guildId, playlistName);
    if (!playlist) return { success: false, reason: "notFound" };

    const tracks = JSON.parse(playlist.tracks) as any[];
    if (tracks.length >= maxSize) return { success: false, reason: "maxSize" };

    tracks.push(track);
    this.db
      .prepare(
        "UPDATE playlists SET tracks = ?, updated_at = ? WHERE id = ?"
      )
      .run(JSON.stringify(tracks), Date.now(), playlist.id);
    return { success: true };
  }

  removeFromPlaylist(
    userId: string,
    guildId: string,
    playlistName: string,
    index: number
  ): boolean {
    const playlist = this.getPlaylist(userId, guildId, playlistName);
    if (!playlist) return false;

    const tracks = JSON.parse(playlist.tracks) as any[];
    if (index < 0 || index >= tracks.length) return false;

    tracks.splice(index, 1);
    this.db
      .prepare(
        "UPDATE playlists SET tracks = ?, updated_at = ? WHERE id = ?"
      )
      .run(JSON.stringify(tracks), Date.now(), playlist.id);
    return true;
  }

  deletePlaylist(userId: string, guildId: string, name: string): boolean {
    const result = this.db
      .prepare(
        "DELETE FROM playlists WHERE user_id = ? AND guild_id = ? AND name = ?"
      )
      .run(userId, guildId, name);
    return result.changes > 0;
  }

  renamePlaylist(
    userId: string,
    guildId: string,
    oldName: string,
    newName: string
  ): boolean {
    const existing = this.db
      .prepare(
        "SELECT id FROM playlists WHERE user_id = ? AND guild_id = ? AND name = ?"
      )
      .get(userId, guildId, newName);
    if (existing) return false;

    const result = this.db
      .prepare(
        "UPDATE playlists SET name = ?, updated_at = ? WHERE user_id = ? AND guild_id = ? AND name = ?"
      )
      .run(newName, Date.now(), userId, guildId, oldName);
    return result.changes > 0;
  }
}

export const db = new BotDatabase();
