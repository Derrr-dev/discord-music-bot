const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder().setName("shuffle").setDescription("Acak antrian / Shuffle queue"),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player || player.queue.isEmpty()) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noQueue", lang))], ephemeral: true });
    player.queue.shuffle = !player.queue.shuffle;
    if (player.queue.shuffle) player.queue.shuffleTracks();
    await interaction.reply({ embeds: [createSuccessEmbed(player.queue.shuffle ? t("shuffle.on", lang) : t("shuffle.off", lang))] });
  },
};
module.exports = { command };
