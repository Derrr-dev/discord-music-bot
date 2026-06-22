const {
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const play = require("play-dl");
const { MusicQueue } = require("./Queue");
const { Track } = require("./Track");
const { spotify } = require("../services/SpotifyService");
const { db } = require("../database/Database");
const { createNowPlayingEmbed } = require("../utils/embeds");

class MusicPlayer {
  constructor(guildId, voiceChannel, textChannel, defaultVolume = 50) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.connection = null;
    this.resource = null;
    this.startTime = 0;
    this.pausedTime = 0;
    this._destroyed = false;
    this._leaveTimeout = null;

    this.queue = new MusicQueue();
    this.queue.volume = defaultVolume;

    this.audioPlayer = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    this._setupEvents();
  }

  _setupEvents() {
    this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
      if (this._destroyed) return;
      const settings = db.getGuildSettings(this.guildId);
      const currentTrack = this.queue.current;

      if (currentTrack) {
        db.addHistory(currentTrack.requestedById, this.guildId, currentTrack.toJSON());
      }

      if (this.queue.autoplay && !this.queue.hasNext() && currentTrack?.spotifyId) {
        await this._handleAutoplay(currentTrack);
        return;
      }

      const next = this.queue.next();
      if (next) {
        await this.playTrack(next);
        if (settings.announceSongs) {
          const embed = createNowPlayingEmbed(next, this.queue, settings.language);
          await this.textChannel.send({ embeds: [embed] }).catch(() => {});
        }
      } else {
        this._startLeaveTimeout();
      }
    });

    this.audioPlayer.on("error", async (err) => {
      console.error(`[Player:${this.guildId}] Error:`, err.message);
      const next = this.queue.next();
      if (next) await this.playTrack(next);
      else this._startLeaveTimeout();
    });
  }

  _startLeaveTimeout() {
    this._clearLeaveTimeout();
    this._leaveTimeout = setTimeout(() => this.destroy(), 5 * 60 * 1000);
  }

  _clearLeaveTimeout() {
    if (this._leaveTimeout) { clearTimeout(this._leaveTimeout); this._leaveTimeout = null; }
  }

  async connect() {
    this.connection = joinVoiceChannel({
      channelId: this.voiceChannel.id,
      guildId: this.guildId,
      adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      this.connection.subscribe(this.audioPlayer);
    } catch {
      this.connection.destroy();
      this.connection = null;
      throw new Error("Failed to join voice channel");
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch { this.destroy(); }
    });
  }

  async play(track) {
    this._clearLeaveTimeout();
    this.queue.add(track);
    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      if (this.queue.current === track) await this.playTrack(track);
    }
  }

  async playTrack(track) {
    try {
      let ytStream;
      if (track.source === "spotify" && track.spotifyId) {
        const results = await play.search(`${track.title} ${track.artist}`, {
          source: { youtube: "video" }, limit: 1,
        });
        if (!results || results.length === 0) throw new Error("No YouTube result");
        track.youtubeId = results[0].id;
        ytStream = await play.stream(results[0].url, { quality: 2 });
      } else if (track.url.includes("youtube.com") || track.url.includes("youtu.be")) {
        ytStream = await play.stream(track.url, { quality: 2 });
      } else {
        const results = await play.search(`${track.title} ${track.artist}`, {
          source: { youtube: "video" }, limit: 1,
        });
        if (!results || results.length === 0) throw new Error("Track not found");
        ytStream = await play.stream(results[0].url, { quality: 2 });
      }

      this.resource = createAudioResource(ytStream.stream, {
        inputType: ytStream.type,
        inlineVolume: true,
      });
      this.resource.volume?.setVolume(this.queue.volume / 100);
      this.startTime = Date.now();
      this.pausedTime = 0;
      this.audioPlayer.play(this.resource);
    } catch (err) {
      console.error(`[Player] Failed to play "${track.title}":`, err.message);
      const next = this.queue.next();
      if (next) await this.playTrack(next);
    }
  }

  async _handleAutoplay(currentTrack) {
    try {
      const recs = await spotify.getRecommendations([currentTrack.spotifyId], 3);
      if (!recs.length) return this._startLeaveTimeout();
      for (const r of recs) {
        this.queue.add(new Track({
          title: r.title, artist: r.artist, album: r.album,
          duration: r.duration, url: r.url, thumbnail: r.thumbnail,
          source: "spotify", requestedBy: "Autoplay",
          requestedById: "autoplay", spotifyId: r.id,
        }));
      }
      const next = this.queue.next();
      if (next) await this.playTrack(next);
    } catch { this._startLeaveTimeout(); }
  }

  pause() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Playing) return false;
    this.audioPlayer.pause();
    this.pausedTime = Date.now();
    return true;
  }

  resume() {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Paused) return false;
    this.audioPlayer.unpause();
    if (this.pausedTime > 0) { this.startTime += Date.now() - this.pausedTime; this.pausedTime = 0; }
    return true;
  }

  stop() {
    this.queue.clear();
    this.audioPlayer.stop(true);
    this._startLeaveTimeout();
  }

  async skip() {
    const current = this.queue.current;
    if (!current) return null;
    const next = this.queue.next();
    if (next) { await this.playTrack(next); return next; }
    this.audioPlayer.stop(true);
    this._startLeaveTimeout();
    return null;
  }

  async previous() {
    const prev = this.queue.previous();
    if (prev) { await this.playTrack(prev); return prev; }
    return null;
  }

  setVolume(volume) {
    this.queue.volume = volume;
    this.resource?.volume?.setVolume(volume / 100);
  }

  getProgress() {
    const total = this.queue.current?.duration || 0;
    const elapsed = this.pausedTime > 0 ? this.pausedTime - this.startTime : Date.now() - this.startTime;
    const current = Math.min(elapsed, total);
    return { current, total, percentage: total > 0 ? (current / total) * 100 : 0 };
  }

  isPlaying() { return this.audioPlayer.state.status === AudioPlayerStatus.Playing; }
  isPaused() { return this.audioPlayer.state.status === AudioPlayerStatus.Paused; }
  getVoiceChannel() { return this.voiceChannel; }
  getTextChannel() { return this.textChannel; }
  setTextChannel(ch) { this.textChannel = ch; }
  setVoiceChannel(ch) { this.voiceChannel = ch; }
  isDestroyed() { return this._destroyed; }

  destroy() {
    this._destroyed = true;
    this._clearLeaveTimeout();
    this.audioPlayer.stop(true);
    if (this.connection) { this.connection.destroy(); this.connection = null; }
  }
}

module.exports = { MusicPlayer };
