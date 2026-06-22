const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Atur volume / Set volume")
    .addIntegerOption(o => o.setName("level").setDescription("Volume (1-100)").setMinValue(1).setMaxValue(100)),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    const level = interaction.options.getInteger("level");
    if (level === null) return void interaction.reply({ embeds: [createSuccessEmbed(t("volume.current", lang, { volume: player.queue.volume }))] });
    player.setVolume(level);
    await interaction.reply({ embeds: [createSuccessEmbed(t("volume.set", lang, { volume: level }))] });
  },
};
module.exports = { command };
