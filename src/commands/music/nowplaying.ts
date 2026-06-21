import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createNowPlayingEmbed, createMusicControls } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Lagu yang sedang diputar / Currently playing song") as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player || !player.queue.current) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    }

    const progress = player.getProgress();
    const embed = createNowPlayingEmbed(player.queue.current, player.queue, lang, progress);
    const controls = createMusicControls();
    await interaction.reply({ embeds: [embed], components: [controls] });
  },
};
