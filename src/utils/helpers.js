const play = require("play-dl");
const { Track } = require("../music/Track");
const { spotify } = require("../services/SpotifyService");

async function resolveQuery(query, requestedBy, requestedById) {
  const spotifyParsed = spotify.parseSpotifyUrl(query);
  if (spotifyParsed) return _resolveSpotify(spotifyParsed, requestedBy, requestedById);

  const ytValidation = await play.validate(query);
  if (ytValidation === "yt_video") return _resolveYTVideo(query, requestedBy, requestedById);
  if (ytValidation === "yt_playlist") return _resolveYTPlaylist(query, requestedBy, requestedById);

  return _resolveSearch(query, requestedBy, requestedById);
}

async function _resolveYTVideo(url, requestedBy, requestedById) {
  try {
    const info = await play.video_info(url);
    const d = info.video_details;
    return {
      tracks: [new Track({
        title: d.title || "Unknown", artist: d.channel?.name || "Unknown",
        album: "", duration: (d.durationInSec || 0) * 1000,
        url: d.url, thumbnail: d.thumbnails?.[0]?.url || "",
        source: "youtube", requestedBy, requestedById,
        youtubeId: d.id, isLive: d.live,
      })],
      isPlaylist: false,
    };
  } catch { return null; }
}

async function _resolveYTPlaylist(url, requestedBy, requestedById) {
  try {
    const playlist = await play.playlist_info(url, { incomplete: true });
    const videos = await playlist.all_videos();
    return {
      tracks: videos.map(v => new Track({
        title: v.title || "Unknown", artist: v.channel?.name || "Unknown",
        album: playlist.title || "", duration: (v.durationInSec || 0) * 1000,
        url: v.url, thumbnail: v.thumbnails?.[0]?.url || "",
        source: "youtube", requestedBy, requestedById, youtubeId: v.id,
      })),
      isPlaylist: true,
      playlistName: playlist.title || "YouTube Playlist",
    };
  } catch { return null; }
}

async function _resolveSpotify(parsed, requestedBy, requestedById) {
  try {
    if (parsed.type === "track") {
      const st = await spotify.getTrack(parsed.id);
      if (!st) return null;
      return {
        tracks: [new Track({
          title: st.title, artist: st.artist, album: st.album,
          duration: st.duration, url: st.url, thumbnail: st.thumbnail,
          source: "spotify", requestedBy, requestedById, spotifyId: st.id,
        })],
        isPlaylist: false,
      };
    }
    if (parsed.type === "playlist") {
      const data = await spotify.getPlaylist(parsed.id);
      if (!data) return null;
      return {
        tracks: data.tracks.map(st => new Track({
          title: st.title, artist: st.artist, album: st.album,
          duration: st.duration, url: st.url, thumbnail: st.thumbnail,
          source: "spotify", requestedBy, requestedById, spotifyId: st.id,
        })),
        isPlaylist: true,
        playlistName: data.name,
      };
    }
    if (parsed.type === "album") {
      const data = await spotify.getAlbum(parsed.id);
      if (!data) return null;
      return {
        tracks: data.tracks.map(st => new Track({
          title: st.title, artist: st.artist, album: st.album,
          duration: st.duration, url: st.url, thumbnail: st.thumbnail,
          source: "spotify", requestedBy, requestedById, spotifyId: st.id,
        })),
        isPlaylist: true,
        playlistName: data.name,
      };
    }
  } catch { return null; }
  return null;
}

async function _resolveSearch(query, requestedBy, requestedById) {
  try {
    const results = await play.search(query, { source: { youtube: "video" }, limit: 1 });
    if (!results || results.length === 0) return null;
    const v = results[0];
    return {
      tracks: [new Track({
        title: v.title || "Unknown", artist: v.channel?.name || "Unknown",
        album: "", duration: (v.durationInSec || 0) * 1000,
        url: v.url, thumbnail: v.thumbnails?.[0]?.url || "",
        source: "search", requestedBy, requestedById, youtubeId: v.id,
      })],
      isPlaylist: false,
    };
  } catch { return null; }
}

async function searchMultiple(query, limit = 10) {
  return play.search(query, { source: { youtube: "video" }, limit });
}

function parseTimeToMs(timeStr) {
  const parts = timeStr.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 1) return parts[0] * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  return null;
}

function createProgressBar(percentage, length = 20) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return "▬".repeat(Math.max(0, filled)) + "🔘" + "▬".repeat(Math.max(0, empty));
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 3) + "..." : str;
}

module.exports = { resolveQuery, searchMultiple, parseTimeToMs, createProgressBar, truncate };
