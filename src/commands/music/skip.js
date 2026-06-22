const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Lewati lagu ini / Skip current song"),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    const skipped = player.queue.current;
    const next = await player.skip();
    await interaction.reply({
      embeds: [createSuccessEmbed(next ? t("skip.success", lang, { title: skipped.title }) : t("skip.noNext", lang))],
    });
  },
};
module.exports = { command };
