const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder().setName("autoplay").setDescription("Toggle putar otomatis rekomendasi / Toggle autoplay"),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    player.queue.autoplay = !player.queue.autoplay;
    await interaction.reply({ embeds: [createSuccessEmbed(player.queue.autoplay ? t("autoplay.on", lang) : t("autoplay.off", lang))] });
  },
};
module.exports = { command };
