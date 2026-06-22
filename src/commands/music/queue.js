const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createQueueEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Lihat antrian lagu / View song queue")
    .addIntegerOption(o => o.setName("page").setDescription("Halaman / Page").setMinValue(1)),
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player || player.queue.isEmpty()) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noQueue", lang))], ephemeral: true });
    const page = interaction.options.getInteger("page") || 1;
    await interaction.reply({ embeds: [createQueueEmbed(player.queue, lang, page)] });
  },
};
module.exports = { command };
