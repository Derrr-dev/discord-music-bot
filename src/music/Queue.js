const { LoopMode } = require("../types/index");

class MusicQueue {
  constructor() {
    this.tracks = [];
    this.history = [];
    this.currentIndex = 0;
    this.loop = LoopMode.NONE;
    this.shuffle = false;
    this.autoplay = false;
    this.volume = 50;
  }

  get current() { return this.tracks[this.currentIndex] || null; }
  get length() { return this.tracks.length; }
  get upcoming() { return this.tracks.slice(this.currentIndex + 1); }
  get all() { return this.tracks; }
  get historyList() { return [...this.history]; }

  add(track, position) {
    if (position !== undefined && position >= 0) {
      this.tracks.splice(this.currentIndex + 1 + position, 0, track);
    } else {
      this.tracks.push(track);
    }
  }

  addMany(tracks) { this.tracks.push(...tracks); }

  remove(index) {
    const absoluteIndex = this.currentIndex + 1 + index;
    if (absoluteIndex >= this.tracks.length) return null;
    const [removed] = this.tracks.splice(absoluteIndex, 1);
    return removed;
  }

  clear() { this.tracks = []; this.currentIndex = 0; }

  next() {
    if (this.loop === LoopMode.TRACK) return this.current;

    const currentTrack = this.current;
    if (currentTrack) {
      this.history.unshift(currentTrack);
      if (this.history.length > 50) this.history.pop();
    }

    if (this.shuffle && this.upcoming.length > 0) {
      const upStart = this.currentIndex + 1;
      const randOffset = Math.floor(Math.random() * this.upcoming.length);
      const [t] = this.tracks.splice(upStart + randOffset, 1);
      this.tracks.splice(upStart, 0, t);
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

  previous() {
    if (this.history.length > 0) {
      const prev = this.history.shift();
      this.tracks.splice(this.currentIndex, 0, prev);
      return this.current;
    }
    if (this.currentIndex > 0) { this.currentIndex--; return this.current; }
    return null;
  }

  shuffleTracks() {
    const upcoming = this.tracks.slice(this.currentIndex + 1);
    for (let i = upcoming.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
    }
    this.tracks = [...this.tracks.slice(0, this.currentIndex + 1), ...upcoming];
  }

  getTotalDuration() { return this.tracks.reduce((acc, t) => acc + (t.duration || 0), 0); }
  isEmpty() { return this.tracks.length === 0; }
  hasNext() {
    if (this.loop === LoopMode.TRACK || this.loop === LoopMode.QUEUE) return true;
    return this.currentIndex < this.tracks.length - 1;
  }
  hasPrevious() { return this.history.length > 0 || this.currentIndex > 0; }
}

module.exports = { MusicQueue };
