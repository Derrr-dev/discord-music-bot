import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { lyricsService } from "../../services/LyricsService";
import { createErrorEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Lihat lirik lagu / View song lyrics")
    .addStringOption((o) =>
      o.setName("query").setDescription("Nama lagu (opsional, default: lagu saat ini)")
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const query = interaction.options.getString("query");

    let title = query;
    let artist = "";

    if (!title) {
      const player = playerManager.get(interaction.guildId!);
      if (!player?.queue.current) {
        return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
      }
      title = player.queue.current.title;
      artist = player.queue.current.artist;
    }

    await interaction.deferReply();

    const lyrics = await lyricsService.getLyrics(title!, artist);
    if (!lyrics) {
      return void interaction.editReply({
        embeds: [createErrorEmbed(t("lyrics.notFound", lang, { title: title! }))],
      });
    }

    const chunks = lyricsService.splitLyrics(lyrics, 4000);
    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle(t("lyrics.title", lang, { title: title! }))
      .setDescription(chunks[0] + (chunks.length > 1 ? `\n\n*${t("lyrics.tooLong", lang)}*` : ""));

    await interaction.editReply({ embeds: [embed] });
  },
};
