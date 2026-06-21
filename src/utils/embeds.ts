import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
} from "discord.js";
import { Track } from "../music/Track";
import { MusicQueue } from "../music/Queue";
import { LoopMode } from "../types";
import { t } from "./i18n";
import { createProgressBar, chunkArray, truncate } from "./helpers";

const COLORS = {
  primary: 0x1db954 as ColorResolvable,
  error: 0xe74c3c as ColorResolvable,
  warning: 0xf39c12 as ColorResolvable,
  success: 0x2ecc71 as ColorResolvable,
  info: 0x3498db as ColorResolvable,
  purple: 0x9b59b6 as ColorResolvable,
};

export function createNowPlayingEmbed(
  track: Track,
  queue: MusicQueue,
  lang: string = "id",
  progress?: { current: number; total: number; percentage: number }
): EmbedBuilder {
  const loopEmoji =
    queue.loop === LoopMode.NONE
      ? "⬜"
      : queue.loop === LoopMode.TRACK
      ? "🔂"
      : "🔁";

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(t("nowplaying.title", lang))
    .setDescription(`**[${truncate(track.title, 60)}](${track.url})**\n${track.artist}`)
    .addFields(
      {
        name: t("common.duration", lang),
        value: track.isLive ? "🔴 LIVE" : track.formattedDuration,
        inline: true,
      },
      {
        name: t("nowplaying.loop", lang),
        value: loopEmoji,
        inline: true,
      },
      {
        name: t("common.volume", lang),
        value: `🔊 ${queue.volume}%`,
        inline: true,
      }
    )
    .setFooter({
      text: `${t("common.requestedBy", lang)}: ${track.requestedBy} • ${
        queue.upcoming.length
      } ${t("queue.songs", lang)} ${t("queue.upNext", lang).toLowerCase()}`,
    })
    .setTimestamp();

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);

  if (progress && !track.isLive) {
    const currentStr = Track.formatDuration(progress.current);
    const totalStr = track.formattedDuration;
    const bar = createProgressBar(progress.percentage);
    embed.addFields({
      name: t("nowplaying.progress", lang),
      value: `${currentStr} ${bar} ${totalStr}`,
    });
  }

  if (queue.shuffle) {
    embed.addFields({ name: "🔀", value: t("shuffle.on", lang), inline: true });
  }
  if (queue.autoplay) {
    embed.addFields({ name: "🎵", value: t("autoplay.on", lang), inline: true });
  }

  return embed;
}

export function createQueueEmbed(
  queue: MusicQueue,
  lang: string = "id",
  page: number = 1
): EmbedBuilder {
  const tracksPerPage = 10;
  const upcoming = queue.upcoming;
  const totalPages = Math.max(1, Math.ceil(upcoming.length / tracksPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = upcoming.slice(
    (safePage - 1) * tracksPerPage,
    safePage * tracksPerPage
  );

  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle(t("queue.title", lang));

  if (queue.current) {
    embed.addFields({
      name: `▶️ ${t("queue.nowPlaying", lang)}`,
      value: `**[${truncate(queue.current.title, 50)}](${queue.current.url})**\n${queue.current.artist} • ${queue.current.formattedDuration}`,
    });
  }

  if (pageItems.length > 0) {
    const list = pageItems
      .map((t, i) => {
        const num = (safePage - 1) * tracksPerPage + i + 1;
        return `\`${num}.\` **${truncate(t.title, 40)}** — ${t.formattedDuration}`;
      })
      .join("\n");

    embed.addFields({
      name: `📋 ${t("queue.upNext", lang)}`,
      value: list,
    });
  } else if (!queue.current) {
    embed.setDescription(t("queue.empty", lang));
  }

  const totalDuration = Track.formatDuration(queue.getTotalDuration());
  const loopEmoji =
    queue.loop === LoopMode.NONE ? "⬜" : queue.loop === LoopMode.TRACK ? "🔂" : "🔁";

  embed.setFooter({
    text: [
      `${t("common.page", lang)}: ${safePage}/${totalPages}`,
      `${upcoming.length + (queue.current ? 1 : 0)} ${t("queue.songs", lang)}`,
      `${t("queue.totalDuration", lang)}: ${totalDuration}`,
      `${t("queue.loop", lang)}: ${loopEmoji}`,
      queue.shuffle ? `🔀 ${t("shuffle.on", lang)}` : "",
    ]
      .filter(Boolean)
      .join(" | "),
  });

  return embed;
}

export function createSearchEmbed(
  results: any[],
  lang: string = "id"
): EmbedBuilder {
  const list = results
    .slice(0, 10)
    .map((r, i) => {
      const dur = r.durationInSec
        ? Track.formatDuration(r.durationInSec * 1000)
        : "?:??";
      return `\`${i + 1}.\` **${truncate(r.title || "Unknown", 50)}** — ${dur}`;
    })
    .join("\n");

  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(t("search.title", lang))
    .setDescription(`${t("search.select", lang)}\n\n${list}`)
    .setFooter({ text: t("search.timeout", lang) });
}

export function createFavoritesEmbed(
  favorites: any[],
  username: string,
  lang: string = "id",
  page: number = 1
): EmbedBuilder {
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(favorites.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = favorites.slice((safePage - 1) * perPage, safePage * perPage);

  const embed = new EmbedBuilder()
    .setColor(0xe91e63 as ColorResolvable)
    .setTitle(`❤️ ${t("favorites.list", lang)} — ${username}`);

  if (items.length === 0) {
    embed.setDescription(t("favorites.empty", lang));
  } else {
    embed.setDescription(
      items
        .map(
          (f, i) =>
            `\`${(safePage - 1) * perPage + i + 1}.\` **${truncate(f.title, 50)}** — ${Track.formatDuration(f.duration)}`
        )
        .join("\n")
    );
  }

  embed.setFooter({
    text: `${t("common.page", lang)}: ${safePage}/${totalPages} | ${favorites.length} ${t("queue.songs", lang)}`,
  });
  return embed;
}

export function createHistoryEmbed(
  history: any[],
  username: string,
  lang: string = "id",
  page: number = 1
): EmbedBuilder {
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(history.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = history.slice((safePage - 1) * perPage, safePage * perPage);

  const embed = new EmbedBuilder()
    .setColor(COLORS.purple)
    .setTitle(`📜 ${t("history.title", lang)} — ${username}`);

  if (items.length === 0) {
    embed.setDescription(t("history.empty", lang));
  } else {
    embed.setDescription(
      items
        .map((h, i) => {
          const date = new Date(h.playedAt).toLocaleDateString("id-ID");
          return `\`${(safePage - 1) * perPage + i + 1}.\` **${truncate(h.title, 45)}** — ${date}`;
        })
        .join("\n")
    );
  }

  embed.setFooter({
    text: `${t("common.page", lang)}: ${safePage}/${totalPages}`,
  });
  return embed;
}

export function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.error)
    .setDescription(`❌ ${message}`);
}

export function createSuccessEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.success)
    .setDescription(message);
}

export function createInfoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.info)
    .setTitle(title)
    .setDescription(description);
}

export function createMusicControls(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("music_previous")
      .setEmoji("⏮️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_pause_resume")
      .setEmoji("⏸️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("music_queue")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary)
  );
}
