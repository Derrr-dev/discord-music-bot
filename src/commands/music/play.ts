import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, VoiceChannel, TextChannel } from "discord.js";
import { Command, BotClient } from "../../types";
import { playerManager } from "../../music/PlayerManager";
import { resolveQuery } from "../../utils/helpers";
import { createErrorEmbed, createSuccessEmbed, createNowPlayingEmbed, createMusicControls } from "../../utils/embeds";
import { db } from "../../database/Database";
import { t } from "../../utils/i18n";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Putar lagu / Play a song")
    .addStringOption((o) =>
      o.setName("query").setDescription("Nama lagu, URL YouTube, atau link Spotify").setRequired(true)
    ) as SlashCommandBuilder,

  voiceRequired: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const settings = db.getGuildSettings(interaction.guildId!);
    const lang = settings.language;
    const query = interaction.options.getString("query", true);
    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel as VoiceChannel;

    if (!voiceChannel) {
      return void interaction.reply({ embeds: [createErrorEmbed(t("common.notInVoice", lang))], ephemeral: true });
    }

    await interaction.deferReply();

    const isSpotify = query.includes("spotify.com") || query.startsWith("spotify:");
    if (isSpotify) {
      await interaction.editReply({ embeds: [createSuccessEmbed(t("play.spotifyLink", lang))] });
    }

    try {
      let player = playerManager.get(interaction.guildId!);
      if (!player || player.isDestroyed()) {
        player = await playerManager.create(
          interaction.guildId!,
          voiceChannel,
          interaction.channel as TextChannel
        );
      }

      const result = await resolveQuery(
        query,
        member.user.username,
        member.user.id
      );

      if (!result || result.tracks.length === 0) {
        return void interaction.editReply({
          embeds: [createErrorEmbed(t("play.notFound", lang, { query }))],
        });
      }

      const { tracks, isPlaylist, playlistName } = result;
      const maxQueue = settings.maxQueueSize;

      if (isPlaylist) {
        const toAdd = tracks.slice(0, maxQueue);
        for (const track of toAdd) {
          await player.play(track);
        }
        await interaction.editReply({
          embeds: [
            createSuccessEmbed(
              t("play.addedPlaylist", lang, {
                count: toAdd.length,
                name: playlistName || "Playlist",
              })
            ),
          ],
        });
      } else {
        const track = tracks[0];
        await player.play(track);

        if (player.queue.all.length === 1) {
          const embed = createNowPlayingEmbed(track, player.queue, lang);
          const controls = createMusicControls();
          await interaction.editReply({ embeds: [embed], components: [controls] });
        } else {
          await interaction.editReply({
            embeds: [
              createSuccessEmbed(
                t("play.added", lang, { title: track.title })
              ),
            ],
          });
        }
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        embeds: [createErrorEmbed(t("common.error", lang))],
      });
    }
  },
};
