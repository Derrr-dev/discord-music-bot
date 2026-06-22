const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { lyricsService } = require("../../services/LyricsService");
const { createErrorEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Lihat lirik lagu / View song lyrics")
    .addStringOption(o => o.setName("query").setDescription("Nama lagu (opsional)")),
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const query = interaction.options.getString("query");
    let title = query, artist = "";

    if (!title) {
      const player = playerManager.get(interaction.guildId);
      if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
      title = player.queue.current.title;
      artist = player.queue.current.artist;
    }

    await interaction.deferReply();
    const lyrics = await lyricsService.getLyrics(title, artist);
    if (!lyrics) return void interaction.editReply({ embeds: [createErrorEmbed(t("lyrics.notFound", lang, { title }))] });

    const chunks = lyricsService.splitLyrics(lyrics, 4000);
    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor(0x1db954)
        .setTitle(t("lyrics.title", lang, { title }))
        .setDescription(chunks[0] + (chunks.length > 1 ? `\n\n*${t("lyrics.tooLong", lang)}*` : ""))],
    });
  },
};
module.exports = { command };
