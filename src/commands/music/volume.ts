import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Atur volume / Set volume")
    .addIntegerOption((o) =>
      o
        .setName("level")
        .setDescription("Volume (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
    ) as SlashCommandBuilder,
  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    }

    const level = interaction.options.getInteger("level");

    if (level === null) {
      return void interaction.reply({
        embeds: [createSuccessEmbed(t("volume.current", lang, { volume: player.queue.volume }))],
      });
    }

    player.setVolume(level);
    await interaction.reply({
      embeds: [createSuccessEmbed(t("volume.set", lang, { volume: level }))],
    });
  },
};
