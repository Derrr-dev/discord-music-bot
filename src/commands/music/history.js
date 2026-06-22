const { SlashCommandBuilder } = require("discord.js");
const { createHistoryEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("Riwayat lagu / Song play history")
    .addSubcommand(s => s.setName("view").setDescription("Lihat riwayat / View history")
      .addIntegerOption(o => o.setName("page").setDescription("Halaman").setMinValue(1)))
    .addSubcommand(s => s.setName("clear").setDescription("Hapus riwayat / Clear history")),
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const sub = interaction.options.getSubcommand();
    if (sub === "clear") {
      db.clearHistory(interaction.user.id, interaction.guildId);
      return void interaction.reply({ embeds: [createSuccessEmbed(t("history.cleared", lang))] });
    }
    const history = db.getHistory(interaction.user.id, interaction.guildId);
    const page = interaction.options.getInteger("page") || 1;
    await interaction.reply({ embeds: [createHistoryEmbed(history, interaction.user.username, lang, page)] });
  },
};
module.exports = { command };
