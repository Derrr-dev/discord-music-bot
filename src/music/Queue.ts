import { LoopMode } from "../types";
import { Track } from "./Track";

export class MusicQueue {
  private tracks: Track[] = [];
  private history: Track[] = [];
  private currentIndex: number = 0;

  loop: LoopMode = LoopMode.NONE;
  shuffle: boolean = false;
  autoplay: boolean = false;
  volume: number = 50;

  get current(): Track | null {
    return this.tracks[this.currentIndex] || null;
  }

  get length(): number {
    return this.tracks.length;
  }

  get upcoming(): Track[] {
    return this.tracks.slice(this.currentIndex + 1);
  }

  get all(): Track[] {
    return this.tracks;
  }

  get historyList(): Track[] {
    return [...this.history];
  }

  add(track: Track, position?: number): void {
    if (position !== undefined && position >= 0 && position < this.tracks.length) {
      this.tracks.splice(this.currentIndex + 1 + position, 0, track);
    } else {
      this.tracks.push(track);
    }
  }

  addMany(tracks: Track[]): void {
    this.tracks.push(...tracks);
  }

  remove(index: number): Track | null {
    const absoluteIndex = this.currentIndex + 1 + index;
    if (absoluteIndex >= this.tracks.length) return null;
    const [removed] = this.tracks.splice(absoluteIndex, 1);
    return removed;
  }

  clear(): void {
    this.tracks = [];
    this.currentIndex = 0;
  }

  next(): Track | null {
    if (this.loop === LoopMode.TRACK) {
      return this.current;
    }

    const currentTrack = this.current;
    if (currentTrack) {
      this.history.unshift(currentTrack);
      if (this.history.length > 50) this.history.pop();
    }

    if (this.shuffle && this.upcoming.length > 0) {
      const upcomingStart = this.currentIndex + 1;
      const randomOffset = Math.floor(Math.random() * this.upcoming.length);
      const targetIndex = upcomingStart + randomOffset;
      const [randomTrack] = this.tracks.splice(targetIndex, 1);
      this.tracks.splice(upcomingStart, 0, randomTrack);
    }

    if (this.currentIndex < this.tracks.length - 1) {
      this.currentIndex++;
      return this.current;
    }

    if (this.loop === LoopMode.QUEUE && this.tracks.length > 0) {
      this.currentIndex = 0;
      return this.current;
    }

    return null;
  }

  previous(): Track | null {
    if (this.history.length > 0) {
      const prevTrack = this.history.shift()!;
      this.tracks.splice(this.currentIndex, 0, prevTrack);
      return this.current;
    }

    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.current;
    }

    return null;
  }

  shuffleTracks(): void {
    const upcoming = this.tracks.slice(this.currentIndex + 1);
    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    this.tracks = [
      ...this.tracks.slice(0, this.currentIndex + 1),
      ...upcoming,
    ];
  }

  move(from: number, to: number): boolean {
    const fromAbsolute = this.currentIndex + 1 + from;
    const toAbsolute = this.currentIndex + 1 + to;

    if (
      fromAbsolute >= this.tracks.length ||
      toAbsolute >= this.tracks.length ||
      fromAbsolute < 0 ||
      toAbsolute < 0
    ) {
      return false;
    }

    const [track] = this.tracks.splice(fromAbsolute, 1);
    this.tracks.splice(toAbsolute, 0, track);
    return true;
  }

  getTotalDuration(): number {
    return this.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  }

  isEmpty(): boolean {
    return this.tracks.length === 0;
  }

  hasNext(): boolean {
    if (this.loop === LoopMode.TRACK || this.loop === LoopMode.QUEUE) return true;
    return this.currentIndex < this.tracks.length - 1;
  }

  hasPrevious(): boolean {
    return this.history.length > 0 || this.currentIndex > 0;
  }
}
