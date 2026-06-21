import SpotifyWebApi from "spotify-web-api-node";
import { SpotifyTrack } from "../types";

export class SpotifyService {
  private api: SpotifyWebApi;
  private tokenExpiry: number = 0;

  constructor() {
    this.api = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });
  }

  private async ensureToken(): Promise<void> {
    if (Date.now() < this.tokenExpiry) return;
    const data = await this.api.clientCredentialsGrant();
    this.api.setAccessToken(data.body.access_token);
    this.tokenExpiry = Date.now() + (data.body.expires_in - 60) * 1000;
  }

  async searchTracks(query: string, limit = 10): Promise<SpotifyTrack[]> {
    await this.ensureToken();
    const result = await this.api.searchTracks(query, { limit });
    const items = result.body.tracks?.items || [];
    return items.map(this.mapTrack);
  }

  async searchAlbums(query: string, limit = 5) {
    await this.ensureToken();
    const result = await this.api.searchAlbums(query, { limit });
    return result.body.albums?.items || [];
  }

  async searchArtists(query: string, limit = 5) {
    await this.ensureToken();
    const result = await this.api.searchArtists(query, { limit });
    return result.body.artists?.items || [];
  }

  async getTrack(spotifyId: string): Promise<SpotifyTrack | null> {
    try {
      await this.ensureToken();
      const result = await this.api.getTrack(spotifyId);
      return this.mapTrack(result.body);
    } catch {
      return null;
    }
  }

  async getPlaylist(
    playlistId: string
  ): Promise<{ name: string; tracks: SpotifyTrack[] } | null> {
    try {
      await this.ensureToken();
      const result = await this.api.getPlaylist(playlistId);
      const name = result.body.name;
      const tracks = result.body.tracks.items
        .filter((item) => item.track && item.track.type === "track")
        .map((item) => this.mapTrack(item.track as SpotifyApi.TrackObjectFull));
      return { name, tracks };
    } catch {
      return null;
    }
  }

  async getAlbum(
    albumId: string
  ): Promise<{ name: string; tracks: SpotifyTrack[] } | null> {
    try {
      await this.ensureToken();
      const album = await this.api.getAlbum(albumId);
      const tracksResult = await this.api.getAlbumTracks(albumId);
      const name = album.body.name;
      const thumbnail =
        album.body.images[0]?.url || "";
      const tracks = tracksResult.body.items.map((t) => ({
        id: t.id,
        title: t.name,
        artist: t.artists.map((a) => a.name).join(", "),
        album: name,
        duration: t.duration_ms,
        thumbnail,
        url: t.external_urls.spotify,
      }));
      return { name, tracks };
    } catch {
      return null;
    }
  }

  async getRecommendations(
    seedTrackIds: string[],
    limit = 5
  ): Promise<SpotifyTrack[]> {
    try {
      await this.ensureToken();
      const result = await this.api.getRecommendations({
        seed_tracks: seedTrackIds.slice(0, 5),
        limit,
      });
      return result.body.tracks.map(this.mapTrack);
    } catch {
      return [];
    }
  }

  private mapTrack(track: SpotifyApi.TrackObjectFull): SpotifyTrack {
    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album?.name || "",
      duration: track.duration_ms,
      thumbnail: track.album?.images[0]?.url || "",
      url: track.external_urls.spotify,
    };
  }

  parseSpotifyUrl(url: string): { type: "track" | "playlist" | "album"; id: string } | null {
    const patterns = [
      { regex: /spotify\.com\/track\/([a-zA-Z0-9]+)/, type: "track" as const },
      { regex: /spotify\.com\/playlist\/([a-zA-Z0-9]+)/, type: "playlist" as const },
      { regex: /spotify\.com\/album\/([a-zA-Z0-9]+)/, type: "album" as const },
      { regex: /^spotify:track:([a-zA-Z0-9]+)$/, type: "track" as const },
      { regex: /^spotify:playlist:([a-zA-Z0-9]+)$/, type: "playlist" as const },
      { regex: /^spotify:album:([a-zA-Z0-9]+)$/, type: "album" as const },
    ];

    for (const { regex, type } of patterns) {
      const match = url.match(regex);
      if (match) return { type, id: match[1] };
    }
    return null;
  }
}

export const spotify = new SpotifyService();
