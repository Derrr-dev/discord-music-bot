import { Track as ITrack } from "../types";

export class Track implements ITrack {
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  thumbnail: string;
  source: "youtube" | "spotify" | "soundcloud" | "search";
  requestedBy: string;
  requestedById: string;
  spotifyId?: string;
  youtubeId?: string;
  isLive?: boolean;
  lyrics?: string;

  constructor(data: ITrack) {
    this.title = data.title;
    this.artist = data.artist;
    this.album = data.album;
    this.duration = data.duration;
    this.url = data.url;
    this.thumbnail = data.thumbnail;
    this.source = data.source;
    this.requestedBy = data.requestedBy;
    this.requestedById = data.requestedById;
    this.spotifyId = data.spotifyId;
    this.youtubeId = data.youtubeId;
    this.isLive = data.isLive;
    this.lyrics = data.lyrics;
  }

  get formattedDuration(): string {
    if (this.isLive) return "🔴 LIVE";
    return Track.formatDuration(this.duration);
  }

  static formatDuration(ms: number): string {
    if (!ms || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  static formatDurationSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  toJSON(): ITrack {
    return {
      title: this.title,
      artist: this.artist,
      album: this.album,
      duration: this.duration,
      url: this.url,
      thumbnail: this.thumbnail,
      source: this.source,
      requestedBy: this.requestedBy,
      requestedById: this.requestedById,
      spotifyId: this.spotifyId,
      youtubeId: this.youtubeId,
      isLive: this.isLive,
    };
  }
}
