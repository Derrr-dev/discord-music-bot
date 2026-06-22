class Track {
  constructor(data) {
    this.title = data.title;
    this.artist = data.artist;
    this.album = data.album || "";
    this.duration = data.duration || 0;
    this.url = data.url;
    this.thumbnail = data.thumbnail || "";
    this.source = data.source;
    this.requestedBy = data.requestedBy;
    this.requestedById = data.requestedById;
    this.spotifyId = data.spotifyId;
    this.youtubeId = data.youtubeId;
    this.isLive = data.isLive || false;
  }

  get formattedDuration() {
    if (this.isLive) return "🔴 LIVE";
    return Track.formatDuration(this.duration);
  }

  static formatDuration(ms) {
    if (!ms || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  toJSON() {
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

module.exports = { Track };
