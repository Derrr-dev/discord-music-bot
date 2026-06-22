const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { Track } = require("../../music/Track");
const { createErrorEmbed, createSuccessEmbed, createFavoritesEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("favorite")
    .setDescription("Kelola lagu favorit / Manage favorite songs")
    .addSubcommand(s => s.setName("add").setDescription("Tambah lagu saat ini ke favorit"))
    .addSubcommand(s => s.setName("remove").setDescription("Hapus lagu dari favorit")
      .addIntegerOption(o => o.setName("index").setDescription("Nomor lagu").setMinValue(1).setRequired(true)))
    .addSubcommand(s => s.setName("list").setDescription("Lihat daftar favorit")
      .addIntegerOption(o => o.setName("page").setDescription("Halaman").setMinValue(1)))
    .addSubcommand(s => s.setName("play").setDescription("Putar semua lagu favorit")),

  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const player = playerManager.get(interaction.guildId);
      if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
      const ok = db.addFavorite(interaction.user.id, interaction.guildId, player.queue.current.toJSON());
      if (!ok) return void interaction.reply({ embeds: [createErrorEmbed(t("favorites.alreadyAdded", lang))], ephemeral: true });
      await interaction.reply({ embeds: [createSuccessEmbed(t("favorites.added", lang, { title: player.queue.current.title }))] });

    } else if (sub === "remove") {
      const index = interaction.options.getInteger("index", true) - 1;
      const favs = db.getFavorites(interaction.user.id, interaction.guildId);
      if (index < 0 || index >= favs.length) return void interaction.reply({ embeds: [createErrorEmbed(t("favorites.notInList", lang))], ephemeral: true });
      db.removeFavorite(interaction.user.id, interaction.guildId, favs[index].url);
      await interaction.reply({ embeds: [createSuccessEmbed(t("favorites.removed", lang, { title: favs[index].title }))] });

    } else if (sub === "list") {
      const favs = db.getFavorites(interaction.user.id, interaction.guildId);
      const page = interaction.options.getInteger("page") || 1;
      await interaction.reply({ embeds: [createFavoritesEmbed(favs, interaction.user.username, lang, page)] });

    } else if (sub === "play") {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
      const favs = db.getFavorites(interaction.user.id, interaction.guildId);
      if (!favs.length) return void interaction.reply({ embeds: [createErrorEmbed(t("favorites.empty", lang))], ephemeral: true });
      await interaction.deferReply();
      let player = playerManager.get(interaction.guildId);
      if (!player || player.isDestroyed()) player = await playerManager.create(interaction.guildId, voiceChannel, interaction.channel);
      for (const fav of favs) {
        await player.play(new Track({ ...fav, requestedBy: interaction.user.username, requestedById: interaction.user.id }));
      }
      await interaction.editReply({ embeds: [createSuccessEmbed(t("play.addedPlaylist", lang, { count: favs.length, name: t("favorites.list", lang) }))] });
    }
  },
};
module.exports = { command };
