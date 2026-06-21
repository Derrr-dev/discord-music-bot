import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Toggle putar otomatis rekomendasi / Toggle autoplay recommendations") as SlashCommandBuilder,
  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    }

    player.queue.autoplay = !player.queue.autoplay;
    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          player.queue.autoplay ? t("autoplay.on", lang) : t("autoplay.off", lang)
        ),
      ],
    });
  },
};
