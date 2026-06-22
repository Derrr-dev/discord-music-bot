const Genius = require("genius-lyrics");

class LyricsService {
  constructor() {
    this.client = new Genius.Client(process.env.GENIUS_API_KEY);
  }

  async getLyrics(title, artist) {
    try {
      const query = artist ? `${artist} ${title}` : title;
      const results = await this.client.songs.search(query);
      if (!results || results.length === 0) return null;
      return await results[0].lyrics() || null;
    } catch { return null; }
  }

  splitLyrics(lyrics, maxLength = 4000) {
    const chunks = [];
    const lines = lyrics.split("\n");
    let current = "";
    for (const line of lines) {
      if ((current + "\n" + line).length > maxLength) {
        if (current) chunks.push(current.trim());
        current = line;
      } else {
        current = current ? current + "\n" + line : line;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }
}

const lyricsService = new LyricsService();
module.exports = { lyricsService, LyricsService };
