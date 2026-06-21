import play from "play-dl";
import { Track } from "../music/Track";
import { spotify } from "../services/SpotifyService";

export async function resolveQuery(
  query: string,
  requestedBy: string,
  requestedById: string
): Promise<{ tracks: Track[]; isPlaylist: boolean; playlistName?: string } | null> {
  // Detect Spotify URL
  const spotifyParsed = spotify.parseSpotifyUrl(query);
  if (spotifyParsed) {
    return resolveSpotify(spotifyParsed, requestedBy, requestedById);
  }

  // Detect YouTube URL
  const ytValidation = await play.validate(query);
  if (ytValidation === "yt_video") {
    return resolveYouTubeVideo(query, requestedBy, requestedById);
  }
  if (ytValidation === "yt_playlist") {
    return resolveYouTubePlaylist(query, requestedBy, requestedById);
  }

  // Plain text search via YouTube
  return resolveSearch(query, requestedBy, requestedById);
}

async function resolveYouTubeVideo(
  url: string,
  requestedBy: string,
  requestedById: string
): Promise<{ tracks: Track[]; isPlaylist: boolean } | null> {
  try {
    const info = await play.video_info(url);
    const details = info.video_details;
    const track = new Track({
      title: details.title || "Unknown Title",
      artist: details.channel?.name || "Unknown Artist",
      album: "",
      duration: (details.durationInSec || 0) * 1000,
      url: details.url,
      thumbnail: details.thumbnails[0]?.url || "",
      source: "youtube",
      requestedBy,
      requestedById,
      youtubeId: details.id,
      isLive: details.live,
    });
    return { tracks: [track], isPlaylist: false };
  } catch {
    return null;
  }
}

async function resolveYouTubePlaylist(
  url: string,
  requestedBy: string,
  requestedById: string
): Promise<{ tracks: Track[]; isPlaylist: boolean; playlistName: string } | null> {
  try {
    const playlist = await play.playlist_info(url, { incomplete: true });
    const videos = await playlist.all_videos();
    const tracks = videos.map(
      (v) =>
        new Track({
          title: v.title || "Unknown",
          artist: v.channel?.name || "Unknown",
          album: playlist.title || "",
          duration: (v.durationInSec || 0) * 1000,
          url: v.url,
          thumbnail: v.thumbnails[0]?.url || "",
          source: "youtube",
          requestedBy,
          requestedById,
          youtubeId: v.id,
        })
    );
    return { tracks, isPlaylist: true, playlistName: playlist.title || "YouTube Playlist" };
  } catch {
    return null;
  }
}

async function resolveSpotify(
  parsed: { type: "track" | "playlist" | "album"; id: string },
  requestedBy: string,
  requestedById: string
): Promise<{ tracks: Track[]; isPlaylist: boolean; playlistName?: string } | null> {
  try {
    if (parsed.type === "track") {
      const sTrack = await spotify.getTrack(parsed.id);
      if (!sTrack) return null;
      const track = new Track({
        title: sTrack.title,
        artist: sTrack.artist,
        album: sTrack.album,
        duration: sTrack.duration,
        url: sTrack.url,
        thumbnail: sTrack.thumbnail,
        source: "spotify",
        requestedBy,
        requestedById,
        spotifyId: sTrack.id,
      });
      return { tracks: [track], isPlaylist: false };
    }

    if (parsed.type === "playlist") {
      const data = await spotify.getPlaylist(parsed.id);
      if (!data) return null;
      const tracks = data.tracks.map(
        (st) =>
          new Track({
            title: st.title,
            artist: st.artist,
            album: st.album,
            duration: st.duration,
            url: st.url,
            thumbnail: st.thumbnail,
            source: "spotify",
            requestedBy,
            requestedById,
            spotifyId: st.id,
          })
      );
      return { tracks, isPlaylist: true, playlistName: data.name };
    }

    if (parsed.type === "album") {
      const data = await spotify.getAlbum(parsed.id);
      if (!data) return null;
      const tracks = data.tracks.map(
        (st) =>
          new Track({
            title: st.title,
            artist: st.artist,
            album: st.album,
            duration: st.duration,
            url: st.url,
            thumbnail: st.thumbnail,
            source: "spotify",
            requestedBy,
            requestedById,
            spotifyId: st.id,
          })
      );
      return { tracks, isPlaylist: true, playlistName: data.name };
    }

    return null;
  } catch {
    return null;
  }
}

async function resolveSearch(
  query: string,
  requestedBy: string,
  requestedById: string
): Promise<{ tracks: Track[]; isPlaylist: boolean } | null> {
  try {
    const results = await play.search(query, {
      source: { youtube: "video" },
      limit: 1,
    });
    if (!results || results.length === 0) return null;

    const v = results[0];
    const track = new Track({
      title: v.title || "Unknown",
      artist: v.channel?.name || "Unknown",
      album: "",
      duration: (v.durationInSec || 0) * 1000,
      url: v.url,
      thumbnail: v.thumbnails[0]?.url || "",
      source: "search",
      requestedBy,
      requestedById,
      youtubeId: v.id,
    });
    return { tracks: [track], isPlaylist: false };
  } catch {
    return null;
  }
}

export async function searchMultiple(query: string, limit = 10) {
  const results = await play.search(query, {
    source: { youtube: "video" },
    limit,
  });
  return results;
}

export function parseTimeToMs(timeStr: string): number | null {
  const parts = timeStr.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  if (parts.length === 1) return parts[0] * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return null;
}

export function createProgressBar(percentage: number, length = 20): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return "▬".repeat(filled) + "🔘" + "▬".repeat(empty);
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}
