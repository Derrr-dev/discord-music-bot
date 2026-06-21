import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("previous")
    .setDescription("Kembali ke lagu sebelumnya / Go to previous song") as SlashCommandBuilder,
  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    }

    const prev = await player.previous();
    if (!prev) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("previous.noPrevious", lang))], ephemeral: true });
    }

    await interaction.reply({
      embeds: [createSuccessEmbed(t("previous.success", lang, { title: prev.title }))],
    });
  },
};
