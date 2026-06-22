const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder().setName("previous").setDescription("Kembali ke lagu sebelumnya / Go to previous song"),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    const prev = await player.previous();
    if (!prev) return void interaction.reply({ embeds: [createErrorEmbed(t("previous.noPrevious", lang))], ephemeral: true });
    await interaction.reply({ embeds: [createSuccessEmbed(t("previous.success", lang, { title: prev.title }))] });
  },
};
module.exports = { command };
