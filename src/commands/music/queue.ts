import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createQueueEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Lihat antrian lagu / View song queue")
    .addIntegerOption((o) =>
      o.setName("page").setDescription("Halaman / Page").setMinValue(1)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player || player.queue.isEmpty()) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noQueue", lang))], ephemeral: true });
    }

    const page = interaction.options.getInteger("page") || 1;
    const embed = createQueueEmbed(player.queue, lang, page);
    await interaction.reply({ embeds: [embed] });
  },
};
