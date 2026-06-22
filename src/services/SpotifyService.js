const SpotifyWebApi = require("spotify-web-api-node");

class SpotifyService {
  constructor() {
    this.api = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
    this.tokenExpiry = 0;
  }

  async ensureToken() {
    if (Date.now() < this.tokenExpiry) return;
    const data = await this.api.clientCredentialsGrant();
    this.api.setAccessToken(data.body.access_token);
    this.tokenExpiry = Date.now() + (data.body.expires_in - 60) * 1000;
  }

  async searchTracks(query, limit = 10) {
    await this.ensureToken();
    const result = await this.api.searchTracks(query, { limit });
    return (result.body.tracks?.items || []).map(t => this._mapTrack(t));
  }

  async getTrack(spotifyId) {
    try {
      await this.ensureToken();
      const result = await this.api.getTrack(spotifyId);
      return this._mapTrack(result.body);
    } catch { return null; }
  }

  async getPlaylist(playlistId) {
    try {
      await this.ensureToken();
      const result = await this.api.getPlaylist(playlistId);
      return {
        name: result.body.name,
        tracks: result.body.tracks.items
          .filter(item => item.track && item.track.type === "track")
          .map(item => this._mapTrack(item.track)),
      };
    } catch { return null; }
  }

  async getAlbum(albumId) {
    try {
      await this.ensureToken();
      const album = await this.api.getAlbum(albumId);
      const tracks = await this.api.getAlbumTracks(albumId);
      const thumbnail = album.body.images[0]?.url || "";
      return {
        name: album.body.name,
        tracks: tracks.body.items.map(t => ({
          id: t.id,
          title: t.name,
          artist: t.artists.map(a => a.name).join(", "),
          album: album.body.name,
          duration: t.duration_ms,
          thumbnail,
          url: t.external_urls.spotify,
        })),
      };
    } catch { return null; }
  }

  async getRecommendations(seedTrackIds, limit = 5) {
    try {
      await this.ensureToken();
      const result = await this.api.getRecommendations({
        seed_tracks: seedTrackIds.slice(0, 5),
        limit,
      });
      return result.body.tracks.map(t => this._mapTrack(t));
    } catch { return []; }
  }

  _mapTrack(track) {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      album: track.album?.name || "",
      duration: track.duration_ms,
      thumbnail: track.album?.images?.[0]?.url || "",
      url: track.external_urls?.spotify || "",
    };
  }

  parseSpotifyUrl(url) {
    const patterns = [
      { regex: /spotify\.com\/track\/([a-zA-Z0-9]+)/, type: "track" },
      { regex: /spotify\.com\/playlist\/([a-zA-Z0-9]+)/, type: "playlist" },
      { regex: /spotify\.com\/album\/([a-zA-Z0-9]+)/, type: "album" },
      { regex: /^spotify:track:([a-zA-Z0-9]+)$/, type: "track" },
      { regex: /^spotify:playlist:([a-zA-Z0-9]+)$/, type: "playlist" },
      { regex: /^spotify:album:([a-zA-Z0-9]+)$/, type: "album" },
    ];
    for (const { regex, type } of patterns) {
      const match = url.match(regex);
      if (match) return { type, id: match[1] };
    }
    return null;
  }
}

const spotify = new SpotifyService();
module.exports = { spotify, SpotifyService };
