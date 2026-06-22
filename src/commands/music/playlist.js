const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { Track } = require("../../music/Track");
const { createErrorEmbed, createSuccessEmbed, createInfoEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");
const { truncate } = require("../../utils/helpers");

const MAX_PLAYLIST = parseInt(process.env.MAX_PLAYLIST_SIZE || "100");

const command = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Kelola playlist / Manage playlists")
    .addSubcommand(s => s.setName("create").setDescription("Buat playlist baru")
      .addStringOption(o => o.setName("name").setDescription("Nama playlist").setRequired(true)))
    .addSubcommand(s => s.setName("delete").setDescription("Hapus playlist")
      .addStringOption(o => o.setName("name").setDescription("Nama playlist").setRequired(true)))
    .addSubcommand(s => s.setName("add").setDescription("Tambah lagu saat ini ke playlist")
      .addStringOption(o => o.setName("name").setDescription("Nama playlist").setRequired(true)))
    .addSubcommand(s => s.setName("remove").setDescription("Hapus lagu dari playlist")
      .addStringOption(o => o.setName("name").setDescription("Nama playlist").setRequired(true))
      .addIntegerOption(o => o.setName("index").setDescription("Nomor lagu").setRequired(true).setMinValue(1)))
    .addSubcommand(s => s.setName("list").setDescription("Lihat semua playlist"))
    .addSubcommand(s => s.setName("view").setDescription("Lihat lagu dalam playlist")
      .addStringOption(o => o.setName("name").setDescription("Nama playlist").setRequired(true)))
    .addSubcommand(s => s.setName("play").setDescription("Putar playlist")
      .addStringOption(o => o.setName("name").setDescription("Nama playlist").setRequired(true)))
    .addSubcommand(s => s.setName("rename").setDescription("Ubah nama playlist")
      .addStringOption(o => o.setName("name").setDescription("Nama lama").setRequired(true))
      .addStringOption(o => o.setName("newname").setDescription("Nama baru").setRequired(true))),

  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const sub = interaction.options.getSubcommand();

    if (sub === "create") {
      const name = interaction.options.getString("name", true);
      const pl = db.createPlaylist(interaction.user.id, interaction.guildId, name);
      if (!pl) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.alreadyExists", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.created", lang, { name }))] });

    } else if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      if (!db.deletePlaylist(interaction.user.id, interaction.guildId, name))
        return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.deleted", lang, { name }))] });

    } else if (sub === "add") {
      const name = interaction.options.getString("name", true);
      const player = playerManager.get(interaction.guildId);
      if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
      const result = db.addToPlaylist(interaction.user.id, interaction.guildId, name, player.queue.current.toJSON(), MAX_PLAYLIST);
      if (!result.success) {
        const msg = result.reason === "maxSize" ? t("playlist.maxSize", lang, { max: MAX_PLAYLIST }) : t("playlist.notFound", lang);
        return void interaction.reply({ embeds: [createErrorEmbed(msg)], ephemeral: true });
      }
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.added", lang, { title: player.queue.current.title, playlist: name }))] });

    } else if (sub === "remove") {
      const name = interaction.options.getString("name", true);
      const index = interaction.options.getInteger("index", true) - 1;
      if (!db.removeFromPlaylist(interaction.user.id, interaction.guildId, name, index))
        return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.removed", lang, { title: `#${index + 1}`, playlist: name }))] });

    } else if (sub === "list") {
      const pls = db.getPlaylists(interaction.user.id, interaction.guildId);
      if (!pls.length) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.noPlaylists", lang))], ephemeral: true });
      const list = pls.map((p, i) => `\`${i + 1}.\` **${p.name}** — ${JSON.parse(p.tracks).length} lagu`).join("\n");
      await interaction.reply({ embeds: [createInfoEmbed(t("playlist.list", lang), list)] });

    } else if (sub === "view") {
      const name = interaction.options.getString("name", true);
      const pl = db.getPlaylist(interaction.user.id, interaction.guildId, name);
      if (!pl) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      const tracks = JSON.parse(pl.tracks);
      const list = tracks.length === 0 ? t("playlist.empty", lang)
        : tracks.slice(0, 20).map((tr, i) => `\`${i + 1}.\` **${truncate(tr.title, 50)}** — ${tr.artist}`).join("\n");
      await interaction.reply({ embeds: [createInfoEmbed(t("playlist.tracks", lang, { name }), list)] });

    } else if (sub === "play") {
      const name = interaction.options.getString("name", true);
      const pl = db.getPlaylist(interaction.user.id, interaction.guildId, name);
      if (!pl) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      const rawTracks = JSON.parse(pl.tracks);
      if (!rawTracks.length) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.empty", lang))], ephemeral: true });
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
      await interaction.deferReply();
      let player = playerManager.get(interaction.guildId);
      if (!player || player.isDestroyed()) player = await playerManager.create(interaction.guildId, voiceChannel, interaction.channel);
      for (const raw of rawTracks) {
        await player.play(new Track({ ...raw, requestedBy: interaction.user.username, requestedById: interaction.user.id }));
      }
      await interaction.editReply({ embeds: [createSuccessEmbed(t("playlist.loaded", lang, { count: rawTracks.length, name }))] });

    } else if (sub === "rename") {
      const name = interaction.options.getString("name", true);
      const newName = interaction.options.getString("newname", true);
      if (!db.renamePlaylist(interaction.user.id, interaction.guildId, name, newName))
        return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.renamed", lang, { name: newName }))] });
    }
  },
};
module.exports = { command };
