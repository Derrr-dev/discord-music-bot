const { SlashCommandBuilder } = require("discord.js");
const { createAudioResource } = require("@discordjs/voice");
const play = require("play-dl");
const { playerManager } = require("../../music/PlayerManager");
const { createErrorEmbed, createSuccessEmbed } = require("../../utils/embeds");
const { db } = require("../../database/Database");
const { t } = require("../../utils/i18n");
const { parseTimeToMs } = require("../../utils/helpers");
const { Track } = require("../../music/Track");

const command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Lompat ke waktu tertentu / Seek to time")
    .addStringOption(o => o.setName("time").setDescription("Waktu (contoh: 1:30 atau 90 detik)").setRequired(true)),
  voiceRequired: true,
  async execute(interaction) {
    const { language: lang } = db.getGuildSettings(interaction.guildId);
    const player = playerManager.get(interaction.guildId);
    if (!player?.queue.current) return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });

    const timeStr = interaction.options.getString("time", true);
    const ms = parseTimeToMs(timeStr);
    if (ms === null) return void interaction.reply({ embeds: [createErrorEmbed(t("seek.invalid", lang))], ephemeral: true });

    const track = player.queue.current;
    if (ms > track.duration) return void interaction.reply({ embeds: [createErrorEmbed(t("seek.outOfRange", lang))], ephemeral: true });

    await interaction.deferReply();
    try {
      const ytStream = await play.stream(track.url, { quality: 2, seek: Math.floor(ms / 1000) });
      const resource = createAudioResource(ytStream.stream, { inputType: ytStream.type, inlineVolume: true });
      resource.volume?.setVolume(player.queue.volume / 100);
      player.resource = resource;
      player.audioPlayer.play(resource);
      await interaction.editReply({ embeds: [createSuccessEmbed(t("seek.success", lang, { time: Track.formatDuration(ms) }))] });
    } catch {
      await interaction.editReply({ embeds: [createErrorEmbed(t("common.error", lang))] });
    }
  },
};
module.exports = { command };
