const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH || "./data/bot.db";

class BotDatabase {
  constructor() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(DB_PATH);
    this._init();
  }

  _init() {
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

  getGuildSettings(guildId) {
    let row = this.db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId);
    if (!row) {
      this.db.prepare("INSERT INTO guild_settings (guild_id) VALUES (?)").run(guildId);
      row = this.db.prepare("SELECT * FROM guild_settings WHERE guild_id = ?").get(guildId);
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

  updateGuildSettings(guildId, settings) {
    const current = this.getGuildSettings(guildId);
    const merged = { ...current, ...settings };
    this.db.prepare(`
      UPDATE guild_settings SET language=?, dj_role_id=?, default_volume=?,
      max_queue_size=?, announce_songs=?, prefix=? WHERE guild_id=?
    `).run(merged.language, merged.djRoleId, merged.defaultVolume,
           merged.maxQueueSize, merged.announceSongs ? 1 : 0, merged.prefix, guildId);
  }

  _ensureUser(userId, guildId) {
    let row = this.db.prepare("SELECT * FROM user_data WHERE user_id=? AND guild_id=?").get(userId, guildId);
    if (!row) {
      this.db.prepare("INSERT INTO user_data (user_id, guild_id) VALUES (?,?)").run(userId, guildId);
      row = this.db.prepare("SELECT * FROM user_data WHERE user_id=? AND guild_id=?").get(userId, guildId);
    }
    return row;
  }

  addFavorite(userId, guildId, track) {
    const row = this._ensureUser(userId, guildId);
    const favorites = JSON.parse(row.favorites);
    if (favorites.some(f => f.url === track.url)) return false;
    favorites.unshift(track);
    if (favorites.length > 100) favorites.pop();
    this.db.prepare("UPDATE user_data SET favorites=? WHERE user_id=? AND guild_id=?")
      .run(JSON.stringify(favorites), userId, guildId);
    return true;
  }

  removeFavorite(userId, guildId, url) {
    const row = this._ensureUser(userId, guildId);
    const favorites = JSON.parse(row.favorites);
    const idx = favorites.findIndex(f => f.url === url);
    if (idx === -1) return false;
    favorites.splice(idx, 1);
    this.db.prepare("UPDATE user_data SET favorites=? WHERE user_id=? AND guild_id=?")
      .run(JSON.stringify(favorites), userId, guildId);
    return true;
  }

  getFavorites(userId, guildId) {
    const row = this._ensureUser(userId, guildId);
    return JSON.parse(row.favorites);
  }

  addHistory(userId, guildId, track) {
    const row = this._ensureUser(userId, guildId);
    const history = JSON.parse(row.history);
    history.unshift({ ...track, playedAt: Date.now() });
    if (history.length > 50) history.pop();
    this.db.prepare("UPDATE user_data SET history=? WHERE user_id=? AND guild_id=?")
      .run(JSON.stringify(history), userId, guildId);
  }

  getHistory(userId, guildId) {
    const row = this._ensureUser(userId, guildId);
    return JSON.parse(row.history);
  }

  clearHistory(userId, guildId) {
    this.db.prepare("UPDATE user_data SET history='[]' WHERE user_id=? AND guild_id=?").run(userId, guildId);
  }

  createPlaylist(userId, guildId, name) {
    const existing = this.db.prepare("SELECT id FROM playlists WHERE user_id=? AND guild_id=? AND name=?")
      .get(userId, guildId, name);
    if (existing) return null;
    const id = `${userId}-${Date.now()}`;
    const now = Date.now();
    this.db.prepare("INSERT INTO playlists (id,name,user_id,guild_id,tracks,created_at,updated_at) VALUES (?,?,?,?,'[]',?,?)")
      .run(id, name, userId, guildId, now, now);
    return { id, name, userId, guildId, tracks: "[]", createdAt: now, updatedAt: now };
  }

  getPlaylists(userId, guildId) {
    return this.db.prepare("SELECT * FROM playlists WHERE user_id=? AND guild_id=?")
      .all(userId, guildId)
      .map(r => ({ id: r.id, name: r.name, userId: r.user_id, guildId: r.guild_id, tracks: r.tracks, createdAt: r.created_at, updatedAt: r.updated_at }));
  }

  getPlaylist(userId, guildId, name) {
    const r = this.db.prepare("SELECT * FROM playlists WHERE user_id=? AND guild_id=? AND name=?").get(userId, guildId, name);
    if (!r) return null;
    return { id: r.id, name: r.name, userId: r.user_id, guildId: r.guild_id, tracks: r.tracks, createdAt: r.created_at, updatedAt: r.updated_at };
  }

  addToPlaylist(userId, guildId, playlistName, track, maxSize) {
    const playlist = this.getPlaylist(userId, guildId, playlistName);
    if (!playlist) return { success: false, reason: "notFound" };
    const tracks = JSON.parse(playlist.tracks);
    if (tracks.length >= maxSize) return { success: false, reason: "maxSize" };
    tracks.push(track);
    this.db.prepare("UPDATE playlists SET tracks=?, updated_at=? WHERE id=?")
      .run(JSON.stringify(tracks), Date.now(), playlist.id);
    return { success: true };
  }

  removeFromPlaylist(userId, guildId, playlistName, index) {
    const playlist = this.getPlaylist(userId, guildId, playlistName);
    if (!playlist) return false;
    const tracks = JSON.parse(playlist.tracks);
    if (index < 0 || index >= tracks.length) return false;
    tracks.splice(index, 1);
    this.db.prepare("UPDATE playlists SET tracks=?, updated_at=? WHERE id=?")
      .run(JSON.stringify(tracks), Date.now(), playlist.id);
    return true;
  }

  deletePlaylist(userId, guildId, name) {
    const r = this.db.prepare("DELETE FROM playlists WHERE user_id=? AND guild_id=? AND name=?").run(userId, guildId, name);
    return r.changes > 0;
  }

  renamePlaylist(userId, guildId, oldName, newName) {
    const existing = this.db.prepare("SELECT id FROM playlists WHERE user_id=? AND guild_id=? AND name=?").get(userId, guildId, newName);
    if (existing) return false;
    const r = this.db.prepare("UPDATE playlists SET name=?, updated_at=? WHERE user_id=? AND guild_id=? AND name=?")
      .run(newName, Date.now(), userId, guildId, oldName);
    return r.changes > 0;
  }
}

const db = new BotDatabase();
module.exports = { db, BotDatabase };
