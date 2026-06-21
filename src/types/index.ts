import {
  ChatInputCommandInteraction,
  Client,
  Collection,
  Guild,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import { MusicPlayer } from "../music/MusicPlayer";

export interface BotClient extends Client {
  commands: Collection<string, Command>;
  players: Map<string, MusicPlayer>;
  cooldowns: Collection<string, Collection<string, number>>;
}

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction, client: BotClient) => Promise<void>;
  adminOnly?: boolean;
  djOnly?: boolean;
  voiceRequired?: boolean;
  cooldown?: number;
}

export interface Track {
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
}

export interface QueueOptions {
  loop: LoopMode;
  shuffle: boolean;
  autoplay: boolean;
  volume: number;
  textChannel: TextChannel;
  voiceChannel: VoiceChannel;
}

export enum LoopMode {
  NONE = "none",
  TRACK = "track",
  QUEUE = "queue",
}

export interface GuildSettings {
  guildId: string;
  language: string;
  djRoleId: string | null;
  defaultVolume: number;
  maxQueueSize: number;
  announceSongs: boolean;
  prefix: string;
}

export interface UserData {
  userId: string;
  guildId: string;
  favorites: string;
  history: string;
  playlists: string;
}

export interface Playlist {
  id: string;
  name: string;
  userId: string;
  guildId: string;
  tracks: string;
  createdAt: number;
  updatedAt: number;
}

export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export interface SearchResult {
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnail: string;
  type: "track" | "album" | "playlist" | "artist";
}

export interface InteractionContext {
  interaction: ChatInputCommandInteraction;
  client: BotClient;
  guild: Guild;
  member: GuildMember;
  player?: MusicPlayer;
}
