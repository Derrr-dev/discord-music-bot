import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Acak antrian / Shuffle queue") as SlashCommandBuilder,
  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player || player.queue.isEmpty()) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noQueue", lang))], ephemeral: true });
    }

    player.queue.shuffle = !player.queue.shuffle;
    if (player.queue.shuffle) player.queue.shuffleTracks();

    await interaction.reply({
      embeds: [
        createSuccessEmbed(
          player.queue.shuffle ? t("shuffle.on", lang) : t("shuffle.off", lang)
        ),
      ],
    });
  },
};
