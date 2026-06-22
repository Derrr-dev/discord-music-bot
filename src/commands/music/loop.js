const { SlashCommandBuilder } = require("discord.js");
const { playerManager } = require("../../music/PlayerManager");
const { LoopMode } = require("../../types/index");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");

const command = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Atur mode ulangi / Set loop mode")
    .addStringOption(o => o.setName("mode").setDescription("Mode").setRequired(true)
      .addChoices(
        { name: "Off (Matikan)", value: "none" },
        { name: "Track (Lagu ini)", value: "track" },
        { name: "Queue (Seluruh antrian)", value: "queue" }
      )),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    const mode = interaction.options.getString("mode", true);
    player.queue.loop = mode;
    const msgs = { [LoopMode.NONE]: t("loop.none", lang), [LoopMode.TRACK]: t("loop.track", lang), [LoopMode.QUEUE]: t("loop.queue", lang) };
    await interaction.reply({ embeds: [createSuccessEmbed(msgs[mode])] });
  },
};
module.exports = { command };
