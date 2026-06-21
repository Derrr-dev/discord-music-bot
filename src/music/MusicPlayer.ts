import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  VoiceConnection,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";
import { TextChannel, VoiceChannel } from "discord.js";
import play from "play-dl";
import { LoopMode } from "../types";
import { Track } from "./Track";
import { MusicQueue } from "./Queue";
import { spotify } from "../services/SpotifyService";
import { db } from "../database/Database";
import { createNowPlayingEmbed } from "../utils/embeds";

export class MusicPlayer {
  readonly guildId: string;
  private connection: VoiceConnection | null = null;
  private audioPlayer: AudioPlayer;
  private resource: AudioResource | null = null;
  private textChannel: TextChannel;
  private voiceChannel: VoiceChannel;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private destroyed: boolean = false;
  private leaveTimeout: NodeJS.Timeout | null = null;

  queue: MusicQueue;

  constructor(
    guildId: string,
    voiceChannel: VoiceChannel,
    textChannel: TextChannel,
    defaultVolume: number = 50
  ) {
    this.guildId = guildId;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.queue = new MusicQueue();
    this.queue.volume = defaultVolume;

    this.audioPlayer = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    this.setupPlayerEvents();
  }

  private setupPlayerEvents() {
    this.audioPlayer.on(AudioPlayerStatus.Idle, async () => {
      if (this.destroyed) return;

      const settings = db.getGuildSettings(this.guildId);
      const currentTrack = this.queue.current;

      if (currentTrack) {
        db.addHistory(
          currentTrack.requestedById,
          this.guildId,
          currentTrack.toJSON()
        );
      }

      if (this.queue.autoplay && !this.queue.hasNext() && currentTrack?.spotifyId) {
        await this.handleAutoplay(currentTrack);
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
        this.startLeaveTimeout();
      }
    });

    this.audioPlayer.on("error", async (error) => {
      console.error(`Audio player error in guild ${this.guildId}:`, error.message);
      const next = this.queue.next();
      if (next) await this.playTrack(next);
      else this.startLeaveTimeout();
    });
  }

  private startLeaveTimeout() {
    this.clearLeaveTimeout();
    this.leaveTimeout = setTimeout(() => {
      this.destroy();
    }, 5 * 60 * 1000);
  }

  private clearLeaveTimeout() {
    if (this.leaveTimeout) {
      clearTimeout(this.leaveTimeout);
      this.leaveTimeout = null;
    }
  }

  async connect(): Promise<void> {
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
          entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });
  }

  async play(track: Track): Promise<void> {
    this.clearLeaveTimeout();
    this.queue.add(track);

    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      if (this.queue.current === track) {
        await this.playTrack(track);
      }
    }
  }

  async playTrack(track: Track): Promise<void> {
    try {
      let source: any;

      if (track.source === "spotify" && track.spotifyId) {
        const ytSearch = await play.search(
          `${track.title} ${track.artist}`,
          { source: { youtube: "video" }, limit: 1 }
        );
        if (!ytSearch || ytSearch.length === 0) throw new Error("No YouTube result found");
        const ytTrack = ytSearch[0];
        track.youtubeId = ytTrack.id;
        const ytStream = await play.stream(ytTrack.url, { quality: 2 });
        source = createAudioResource(ytStream.stream, {
          inputType: ytStream.type,
          inlineVolume: true,
        });
      } else if (track.url.includes("youtube.com") || track.url.includes("youtu.be")) {
        const ytStream = await play.stream(track.url, { quality: 2 });
        source = createAudioResource(ytStream.stream, {
          inputType: ytStream.type,
          inlineVolume: true,
        });
      } else {
        const ytResults = await play.search(`${track.title} ${track.artist}`, {
          source: { youtube: "video" },
          limit: 1,
        });
        if (!ytResults || ytResults.length === 0) throw new Error("Track not found");
        const ytStream = await play.stream(ytResults[0].url, { quality: 2 });
        source = createAudioResource(ytStream.stream, {
          inputType: ytStream.type,
          inlineVolume: true,
        });
      }

      this.resource = source;
      this.resource.volume?.setVolume(this.queue.volume / 100);
      this.startTime = Date.now();
      this.pausedTime = 0;
      this.audioPlayer.play(this.resource);
    } catch (error) {
      console.error(`Error playing track "${track.title}":`, error);
      const next = this.queue.next();
      if (next) await this.playTrack(next);
    }
  }

  private async handleAutoplay(currentTrack: Track) {
    try {
      if (!currentTrack.spotifyId) return;
      const recommendations = await spotify.getRecommendations(
        [currentTrack.spotifyId],
        3
      );
      if (recommendations.length === 0) return;

      for (const rec of recommendations) {
        const track = new Track({
          title: rec.title,
          artist: rec.artist,
          album: rec.album,
          duration: rec.duration,
          url: rec.url,
          thumbnail: rec.thumbnail,
          source: "spotify",
          requestedBy: "Autoplay",
          requestedById: "autoplay",
          spotifyId: rec.id,
        });
        this.queue.add(track);
      }

      const next = this.queue.next();
      if (next) await this.playTrack(next);
    } catch {
      this.startLeaveTimeout();
    }
  }

  pause(): boolean {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Playing) return false;
    this.audioPlayer.pause();
    this.pausedTime = Date.now();
    return true;
  }

  resume(): boolean {
    if (this.audioPlayer.state.status !== AudioPlayerStatus.Paused) return false;
    this.audioPlayer.unpause();
    if (this.pausedTime > 0) {
      this.startTime += Date.now() - this.pausedTime;
      this.pausedTime = 0;
    }
    return true;
  }

  stop(): void {
    this.queue.clear();
    this.audioPlayer.stop(true);
    this.startLeaveTimeout();
  }

  async skip(): Promise<Track | null> {
    const current = this.queue.current;
    if (!current) return null;

    const next = this.queue.next();
    if (next) {
      await this.playTrack(next);
      return next;
    } else {
      this.audioPlayer.stop(true);
      this.startLeaveTimeout();
      return null;
    }
  }

  async previous(): Promise<Track | null> {
    const prev = this.queue.previous();
    if (prev) {
      await this.playTrack(prev);
      return prev;
    }
    return null;
  }

  setVolume(volume: number): void {
    this.queue.volume = volume;
    this.resource?.volume?.setVolume(volume / 100);
  }

  getProgress(): { current: number; total: number; percentage: number } {
    const total = this.queue.current?.duration || 0;
    const elapsed = this.pausedTime > 0
      ? this.pausedTime - this.startTime
      : Date.now() - this.startTime;
    const current = Math.min(elapsed, total);
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return { current, total, percentage };
  }

  isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
  }

  isPaused(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
  }

  setTextChannel(channel: TextChannel): void {
    this.textChannel = channel;
  }

  setVoiceChannel(channel: VoiceChannel): void {
    this.voiceChannel = channel;
  }

  getVoiceChannel(): VoiceChannel {
    return this.voiceChannel;
  }

  getTextChannel(): TextChannel {
    return this.textChannel;
  }

  destroy(): void {
    this.destroyed = true;
    this.clearLeaveTimeout();
    this.audioPlayer.stop(true);
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}
