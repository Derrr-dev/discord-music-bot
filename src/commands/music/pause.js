const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Jeda musik / Pause music"),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    if (!player.pause()) return void interaction.reply({ embeds: [createErrorEmbed(t("pause.alreadyPaused", lang))], ephemeral: true });
    await interaction.reply({ embeds: [createSuccessEmbed(t("pause.success", lang))] });
  },
};
module.exports = { command };
