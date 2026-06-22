const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { Track } = require("../music/Track");
const { LoopMode } = require("../types/index");
const { t } = require("./i18n");
const { createProgressBar, truncate } = require("./helpers");

function createNowPlayingEmbed(track, queue, lang = "id", progress) {
  const loopEmoji = queue.loop === LoopMode.NONE ? "⬜" : queue.loop === LoopMode.TRACK ? "🔂" : "🔁";
  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle(t("nowplaying.title", lang))
    .setDescription(`**[${truncate(track.title, 60)}](${track.url})**\n${track.artist}`)
    .addFields(
      { name: t("common.duration", lang), value: track.isLive ? "🔴 LIVE" : track.formattedDuration, inline: true },
      { name: t("nowplaying.loop", lang), value: loopEmoji, inline: true },
      { name: t("common.volume", lang), value: `🔊 ${queue.volume}%`, inline: true }
    )
    .setFooter({
      text: `${t("common.requestedBy", lang)}: ${track.requestedBy} • ${queue.upcoming.length} ${t("queue.songs", lang)} ${t("queue.upNext", lang).toLowerCase()}`,
    })
    .setTimestamp();

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);

  if (progress && !track.isLive) {
    const bar = createProgressBar(progress.percentage);
    embed.addFields({
      name: t("nowplaying.progress", lang),
      value: `${Track.formatDuration(progress.current)} ${bar} ${track.formattedDuration}`,
    });
  }

  if (queue.shuffle) embed.addFields({ name: "🔀", value: t("shuffle.on", lang), inline: true });
  if (queue.autoplay) embed.addFields({ name: "🎵", value: t("autoplay.on", lang), inline: true });

  return embed;
}

function createQueueEmbed(queue, lang = "id", page = 1) {
  const perPage = 10;
  const upcoming = queue.upcoming;
  const totalPages = Math.max(1, Math.ceil(upcoming.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = upcoming.slice((safePage - 1) * perPage, safePage * perPage);

  const embed = new EmbedBuilder().setColor(0x1db954).setTitle(t("queue.title", lang));

  if (queue.current) {
    embed.addFields({
      name: `▶️ ${t("queue.nowPlaying", lang)}`,
      value: `**[${truncate(queue.current.title, 50)}](${queue.current.url})**\n${queue.current.artist} • ${queue.current.formattedDuration}`,
    });
  }

  if (items.length > 0) {
    embed.addFields({
      name: `📋 ${t("queue.upNext", lang)}`,
      value: items.map((tr, i) =>
        `\`${(safePage - 1) * perPage + i + 1}.\` **${truncate(tr.title, 40)}** — ${tr.formattedDuration}`
      ).join("\n"),
    });
  } else if (!queue.current) {
    embed.setDescription(t("queue.empty", lang));
  }

  const loopEmoji = queue.loop === LoopMode.NONE ? "⬜" : queue.loop === LoopMode.TRACK ? "🔂" : "🔁";
  embed.setFooter({
    text: [
      `${t("common.page", lang)}: ${safePage}/${totalPages}`,
      `${upcoming.length + (queue.current ? 1 : 0)} ${t("queue.songs", lang)}`,
      `${t("queue.totalDuration", lang)}: ${Track.formatDuration(queue.getTotalDuration())}`,
      `${t("queue.loop", lang)}: ${loopEmoji}`,
      queue.shuffle ? `🔀` : "",
    ].filter(Boolean).join(" | "),
  });

  return embed;
}

function createSearchEmbed(results, lang = "id") {
  const list = results.slice(0, 10).map((r, i) => {
    const dur = r.durationInSec ? Track.formatDuration(r.durationInSec * 1000) : "?:??";
    return `\`${i + 1}.\` **${truncate(r.title || "Unknown", 50)}** — ${dur}`;
  }).join("\n");

  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle(t("search.title", lang))
    .setDescription(`${t("search.select", lang)}\n\n${list}`)
    .setFooter({ text: t("search.timeout", lang) });
}

function createFavoritesEmbed(favorites, username, lang = "id", page = 1) {
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(favorites.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = favorites.slice((safePage - 1) * perPage, safePage * perPage);

  const embed = new EmbedBuilder()
    .setColor(0xe91e63)
    .setTitle(`❤️ ${t("favorites.list", lang)} — ${username}`);

  embed.setDescription(
    items.length === 0
      ? t("favorites.empty", lang)
      : items.map((f, i) =>
          `\`${(safePage - 1) * perPage + i + 1}.\` **${truncate(f.title, 50)}** — ${Track.formatDuration(f.duration)}`
        ).join("\n")
  );
  embed.setFooter({ text: `${t("common.page", lang)}: ${safePage}/${totalPages} | ${favorites.length} ${t("queue.songs", lang)}` });
  return embed;
}

function createHistoryEmbed(history, username, lang = "id", page = 1) {
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(history.length / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = history.slice((safePage - 1) * perPage, safePage * perPage);

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`📜 ${t("history.title", lang)} — ${username}`);

  embed.setDescription(
    items.length === 0
      ? t("history.empty", lang)
      : items.map((h, i) => {
          const date = new Date(h.playedAt).toLocaleDateString("id-ID");
          return `\`${(safePage - 1) * perPage + i + 1}.\` **${truncate(h.title, 45)}** — ${date}`;
        }).join("\n")
  );
  embed.setFooter({ text: `${t("common.page", lang)}: ${safePage}/${totalPages}` });
  return embed;
}

function createErrorEmbed(message) {
  return new EmbedBuilder().setColor(0xe74c3c).setDescription(`❌ ${message}`);
}

function createSuccessEmbed(message) {
  return new EmbedBuilder().setColor(0x2ecc71).setDescription(message);
}

function createInfoEmbed(title, description) {
  return new EmbedBuilder().setColor(0x3498db).setTitle(title).setDescription(description);
}

function createMusicControls() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("music_previous").setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_pause_resume").setEmoji("⏸️").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("music_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("music_queue").setEmoji("📋").setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  createNowPlayingEmbed, createQueueEmbed, createSearchEmbed,
  createFavoritesEmbed, createHistoryEmbed, createErrorEmbed,
  createSuccessEmbed, createInfoEmbed, createMusicControls,
};
