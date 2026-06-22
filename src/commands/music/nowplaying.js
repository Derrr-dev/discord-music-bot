const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createNowPlayingEmbed, createMusicControls } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Lagu yang sedang diputar / Currently playing song"),
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    await interaction.reply({
      embeds: [createNowPlayingEmbed(player.queue.current, player.queue, lang, player.getProgress())],
      components: [createMusicControls()],
    });
  },
};
module.exports = { command };
