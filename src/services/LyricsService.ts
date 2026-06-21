import Genius from "genius-lyrics";

export class LyricsService {
  private client: Genius.Client;

  constructor() {
    this.client = new Genius.Client(process.env.GENIUS_API_KEY);
  }

  async getLyrics(title: string, artist?: string): Promise<string | null> {
    try {
      const query = artist ? `${artist} ${title}` : title;
      const searches = await this.client.songs.search(query);
      if (!searches || searches.length === 0) return null;

      const song = searches[0];
      const lyrics = await song.lyrics();
      return lyrics || null;
    } catch {
      return null;
    }
  }

  splitLyrics(lyrics: string, maxLength = 1024): string[] {
    const chunks: string[] = [];
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

export const lyricsService = new LyricsService();
