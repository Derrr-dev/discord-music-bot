import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { createHistoryEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("Riwayat lagu yang pernah diputar / Song play history")
    .addSubcommand((s) =>
      s
        .setName("view")
        .setDescription("Lihat riwayat / View history")
        .addIntegerOption((o) => o.setName("page").setDescription("Halaman").setMinValue(1))
    )
    .addSubcommand((s) =>
      s.setName("clear").setDescription("Hapus riwayat / Clear history")
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const sub = interaction.options.getSubcommand();

    if (sub === "clear") {
      db.clearHistory(interaction.user.id, interaction.guildId!);
      return void interaction.reply({
        embeds: [createSuccessEmbed(t("history.cleared", lang))],
      });
    }

    const history = db.getHistory(interaction.user.id, interaction.guildId!);
    const page = interaction.options.getInteger("page") || 1;
    const embed = createHistoryEmbed(history, interaction.user.username, lang, page);
    await interaction.reply({ embeds: [embed] });
  },
};
