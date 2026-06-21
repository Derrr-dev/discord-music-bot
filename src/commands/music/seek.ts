import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { createErrorEmbed, createSuccessEmbed } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";
import { parseTimeToMs } from "../../utils/helpers";
import { Track } from "../../music/Track";
import play from "play-dl";
import { createAudioResource } from "@discordjs/voice";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Lompat ke waktu tertentu / Seek to time")
    .addStringOption((o) =>
      o.setName("time").setDescription("Waktu (contoh: 1:30 atau 90 detik)").setRequired(true)
    ) as SlashCommandBuilder,
  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const player = playerManager.get(interaction.guildId!);

    if (!player?.queue.current) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.noPlayer", lang))], ephemeral: true });
    }

    const timeStr = interaction.options.getString("time", true);
    const ms = parseTimeToMs(timeStr);

    if (ms === null) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("seek.invalid", lang))], ephemeral: true });
    }

    const track = player.queue.current;
    if (ms > track.duration) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("seek.outOfRange", lang))], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const seekSeconds = Math.floor(ms / 1000);
      const ytStream = await play.stream(track.url, { quality: 2, seek: seekSeconds });
      const resource = createAudioResource(ytStream.stream, {
        inputType: ytStream.type,
        inlineVolume: true,
      });
      resource.volume?.setVolume(player.queue.volume / 100);

      (player as any).resource = resource;
      (player as any).audioPlayer.play(resource);

      await interaction.editReply({
        embeds: [createSuccessEmbed(t("seek.success", lang, { time: Track.formatDuration(ms) }))],
      });
    } catch {
      await interaction.editReply({ embeds: [createErrorEmbed(t("common.error", lang))] });
    }
  },
};
