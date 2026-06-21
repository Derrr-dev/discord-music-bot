import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { LoopMode } from "../../types";
import { createErrorEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Atur mode ulangi / Set loop mode")
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Mode ulangi / Loop mode")
        .setRequired(true)
        .addChoices(
          { name: "Off (Matikan)", value: "none" },
          { name: "Track (Lagu ini)", value: "track" },
          { name: "Queue (Seluruh antrian)", value: "queue" }
        )
    ) as SlashCommandBuilder,
  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    }

    const mode = interaction.options.getString("mode", true) as LoopMode;
    player.queue.loop = mode;

    const messages: Record<LoopMode, string> = {
      [LoopMode.NONE]: t("loop.none", lang),
      [LoopMode.TRACK]: t("loop.track", lang),
      [LoopMode.QUEUE]: t("loop.queue", lang),
    };

    await interaction.reply({ embeds: [createSuccessEmbed(messages[mode])] });
  },
};
