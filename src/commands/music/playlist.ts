import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  VoiceChannel,
  TextChannel,
} from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { Track } from "../../music/Track";
import { createErrorEmbed, createSuccessEmbed, createInfoEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";
import { truncate } from "../../utils/helpers";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Kelola playlist / Manage playlists")
    .addSubcommand((s) =>
      s.setName("create").setDescription("Buat playlist baru")
        .addStringOption((o) => o.setName("name").setDescription("Nama playlist").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("delete").setDescription("Hapus playlist")
        .addStringOption((o) => o.setName("name").setDescription("Nama playlist").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("add").setDescription("Tambah lagu saat ini ke playlist")
        .addStringOption((o) => o.setName("name").setDescription("Nama playlist").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Hapus lagu dari playlist")
        .addStringOption((o) => o.setName("name").setDescription("Nama playlist").setRequired(true))
        .addIntegerOption((o) => o.setName("index").setDescription("Nomor lagu").setRequired(true).setMinValue(1))
    )
    .addSubcommand((s) =>
      s.setName("list").setDescription("Lihat semua playlist kamu")
    )
    .addSubcommand((s) =>
      s.setName("view").setDescription("Lihat lagu dalam playlist")
        .addStringOption((o) => o.setName("name").setDescription("Nama playlist").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("play").setDescription("Putar playlist")
        .addStringOption((o) => o.setName("name").setDescription("Nama playlist").setRequired(true))
    )
    .addSubcommand((s) =>
      s.setName("rename").setDescription("Ubah nama playlist")
        .addStringOption((o) => o.setName("name").setDescription("Nama lama").setRequired(true))
        .addStringOption((o) => o.setName("newname").setDescription("Nama baru").setRequired(true))
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const sub = interaction.options.getSubcommand();
    const maxPlaylist = parseInt(process.env.MAX_PLAYLIST_SIZE || "100");

    if (sub === "create") {
      const name = interaction.options.getString("name", true);
      const playlist = db.createPlaylist(interaction.user.id, interaction.guildId!, name);
      if (!playlist) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.alreadyExists", lang))], ephemeral: true });
      }
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.created", lang, { name }))] });

    } else if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      const ok = db.deletePlaylist(interaction.user.id, interaction.guildId!, name);
      if (!ok) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.deleted", lang, { name }))] });

    } else if (sub === "add") {
      const name = interaction.options.getString("name", true);
      const player = playerManager.get(interaction.guildId!);
      if (!player?.queue.current) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
      }
      const track = player.queue.current;
      const result = db.addToPlaylist(interaction.user.id, interaction.guildId!, name, track.toJSON(), maxPlaylist);
      if (!result.success) {
        const msg = result.reason === "maxSize" ? t("playlist.maxSize", lang, { max: maxPlaylist }) : t("playlist.notFound", lang);
        return void interaction.reply({ embeds: [createErrorEmbed(msg)], ephemeral: true });
      }
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.added", lang, { title: track.title, playlist: name }))] });

    } else if (sub === "remove") {
      const name = interaction.options.getString("name", true);
      const index = interaction.options.getInteger("index", true) - 1;
      const ok = db.removeFromPlaylist(interaction.user.id, interaction.guildId!, name, index);
      if (!ok) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.removed", lang, { title: `#${index + 1}`, playlist: name }))] });

    } else if (sub === "list") {
      const playlists = db.getPlaylists(interaction.user.id, interaction.guildId!);
      if (playlists.length === 0) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.noPlaylists", lang))], ephemeral: true });
      }
      const list = playlists.map((p, i) => {
        const tracks = JSON.parse(p.tracks);
        return `\`${i + 1}.\` **${p.name}** — ${tracks.length} lagu`;
      }).join("\n");
      await interaction.reply({ embeds: [createInfoEmbed(t("playlist.list", lang), list)] });

    } else if (sub === "view") {
      const name = interaction.options.getString("name", true);
      const playlist = db.getPlaylist(interaction.user.id, interaction.guildId!, name);
      if (!playlist) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });

      const tracks = JSON.parse(playlist.tracks);
      const list = tracks.length === 0
        ? t("playlist.empty", lang)
        : tracks.slice(0, 20).map((tr: any, i: number) =>
            `\`${i + 1}.\` **${truncate(tr.title, 50)}** — ${tr.artist}`
          ).join("\n");

      await interaction.reply({ embeds: [createInfoEmbed(t("playlist.tracks", lang, { name }), list)] });

    } else if (sub === "play") {
      const name = interaction.options.getString("name", true);
      const playlist = db.getPlaylist(interaction.user.id, interaction.guildId!, name);
      if (!playlist) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });

      const rawTracks = JSON.parse(playlist.tracks);
      if (rawTracks.length === 0) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.empty", lang))], ephemeral: true });

      const member = interaction.member as GuildMember;
      const voiceChannel = member.voice.channel as VoiceChannel;
      if (!voiceChannel) return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });

      await interaction.deferReply();

      let player = playerManager.get(interaction.guildId!);
      if (!player || player.isDestroyed()) {
        player = await playerManager.create(interaction.guildId!, voiceChannel, interaction.channel as TextChannel);
      }

      for (const raw of rawTracks) {
        const track = new Track({ ...raw, requestedBy: interaction.user.username, requestedById: interaction.user.id });
        await player.play(track);
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(t("playlist.loaded", lang, { count: rawTracks.length, name }))],
      });

    } else if (sub === "rename") {
      const name = interaction.options.getString("name", true);
      const newName = interaction.options.getString("newname", true);
      const ok = db.renamePlaylist(interaction.user.id, interaction.guildId!, name, newName);
      if (!ok) return void interaction.reply({ embeds: [createErrorEmbed(t("playlist.notFound", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("playlist.renamed", lang, { name: newName }))] });
    }
  },
};
