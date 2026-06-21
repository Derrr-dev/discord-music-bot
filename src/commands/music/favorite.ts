import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createSuccessEmbed, createFavoritesEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("favorite")
    .setDescription("Kelola lagu favorit / Manage favorite songs")
    .addSubcommand((s) =>
      s.setName("add").setDescription("Tambah lagu saat ini ke favorit / Add current song to favorites")
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Hapus lagu dari favorit / Remove song from favorites")
        .addIntegerOption((o) =>
          o.setName("index").setDescription("Nomor lagu dalam daftar favorit").setMinValue(1).setRequired(true)
        )
    )
    .addSubcommand((s) =>
      s.setName("list").setDescription("Lihat daftar favorit / View favorites")
        .addIntegerOption((o) => o.setName("page").setDescription("Halaman").setMinValue(1))
    )
    .addSubcommand((s) =>
      s.setName("play").setDescription("Putar semua lagu favorit / Play all favorites")
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const player = playerManager.get(interaction.guildId!);
      if (!player?.queue.current) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
      }

      const track = player.queue.current;
      const added = db.addFavorite(interaction.user.id, interaction.guildId!, track.toJSON());

      if (!added) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("favorites.alreadyAdded", lang))], ephemeral: true });
      }

      await interaction.reply({
        embeds: [createSuccessEmbed(t("favorites.added", lang, { title: track.title }))],
      });
    } else if (sub === "remove") {
      const index = interaction.options.getInteger("index", true) - 1;
      const favorites = db.getFavorites(interaction.user.id, interaction.guildId!);

      if (index < 0 || index >= favorites.length) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("favorites.notInList", lang))], ephemeral: true });
      }

      const fav = favorites[index];
      db.removeFavorite(interaction.user.id, interaction.guildId!, fav.url);
      await interaction.reply({
        embeds: [createSuccessEmbed(t("favorites.removed", lang, { title: fav.title }))],
      });
    } else if (sub === "list") {
      const favorites = db.getFavorites(interaction.user.id, interaction.guildId!);
      const page = interaction.options.getInteger("page") || 1;
      const embed = createFavoritesEmbed(favorites, interaction.user.username, lang, page);
      await interaction.reply({ embeds: [embed] });
    } else if (sub === "play") {
      const { GuildMember, VoiceChannel, TextChannel } = await import("discord.js");
      const member = interaction.member as InstanceType<typeof GuildMember>;
      const voiceChannel = member.voice.channel as InstanceType<typeof VoiceChannel>;

      if (!voiceChannel) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
      }

      const favorites = db.getFavorites(interaction.user.id, interaction.guildId!);
      if (favorites.length === 0) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("favorites.empty", lang))], ephemeral: true });
      }

      await interaction.deferReply();

      const { Track } = await import("../../music/Track");
      let player = playerManager.get(interaction.guildId!);
      if (!player || player.isDestroyed()) {
        player = await playerManager.create(
          interaction.guildId!,
          voiceChannel,
          interaction.channel as InstanceType<typeof TextChannel>
        );
      }

      for (const fav of favorites) {
        const track = new Track({ ...fav, requestedBy: interaction.user.username, requestedById: interaction.user.id });
        await player.play(track);
      }

      await interaction.editReply({
        embeds: [createSuccessEmbed(t("play.addedPlaylist", lang, { count: favorites.length, name: t("favorites.list", lang) }))],
      });
    }
  },
};
